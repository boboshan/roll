<script lang="ts">
	import { fetchFile } from '@ffmpeg/util';
	import { Download, ArrowRightLeft, ChevronRight } from 'lucide-svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import VideoComparison from '$lib/components/VideoComparison.svelte';
	import { video } from '$lib/state/video-manager.svelte';
	import { onMount } from 'svelte';

	let videoEl = $state<HTMLVideoElement>();

	// Format configurations
	const formats = {
		mp4: {
			label: 'MP4',
			mimeType: 'video/mp4',
			videoCodecs: [
				{ id: 'libx264', name: 'H.264 (most compatible)' },
				{ id: 'libx265', name: 'H.265/HEVC (smaller size)' }
			],
			audioCodecs: [
				{ id: 'aac', name: 'AAC (recommended)' },
				{ id: 'mp3', name: 'MP3' }
			]
		},
		webm: {
			label: 'WebM',
			mimeType: 'video/webm',
			videoCodecs: [
				{ id: 'libvpx', name: 'VP8 (compatible)' },
				{ id: 'libvpx-vp9', name: 'VP9 (better quality)' }
			],
			audioCodecs: [
				{ id: 'libopus', name: 'Opus (recommended)' },
				{ id: 'libvorbis', name: 'Vorbis' }
			]
		},
		mov: {
			label: 'MOV',
			mimeType: 'video/quicktime',
			videoCodecs: [
				{ id: 'libx264', name: 'H.264 (compatible)' },
				{ id: 'prores_ks', name: 'ProRes (editing)' }
			],
			audioCodecs: [
				{ id: 'aac', name: 'AAC (recommended)' },
				{ id: 'pcm_s16le', name: 'PCM (uncompressed)' }
			]
		}
	} as const;

	type FormatKey = keyof typeof formats;

	let outputFormat = $state<FormatKey>('mp4');
	let videoCodecOverride = $state<string | null>(null);
	let audioCodecOverride = $state<string | null>(null);
	let quality = $state(23); // CRF value
	let showAdvanced = $state(false);

	const currentFormat = $derived(formats[outputFormat]);
	const videoCodec = $derived(videoCodecOverride ?? currentFormat.videoCodecs[0].id);
	const audioCodec = $derived(audioCodecOverride ?? currentFormat.audioCodecs[0].id);

	// Reset overrides when format changes
	$effect(() => {
		void outputFormat; // Track this
		videoCodecOverride = null;
		audioCodecOverride = null;
	});

	onMount(() => {
		video.use('convert');
	});

	function handleLoadedMetadata() {
		if (videoEl?.duration && isFinite(videoEl.duration)) {
			video.duration = videoEl.duration;
		}
	}

	async function convert() {
		if (!video.file || !video.ffmpeg) return;

		video.startProcessing();

		const inputExt = video.extension;
		const inputName = `input${inputExt}`;
		const outputName = `output.${outputFormat}`;

		try {
			const response = await fetch(video.sourceUrl);
			const inputBlob = await response.blob();
			await video.ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

			// Build FFmpeg command based on settings
			const args = ['-i', inputName];

			// Video codec
			args.push('-c:v', videoCodec);

			// Quality (CRF) - not applicable to all codecs
			if (['libx264', 'libx265', 'libvpx-vp9'].includes(videoCodec)) {
				args.push('-crf', String(quality));
			}
			if (videoCodec === 'libvpx') {
				args.push('-b:v', '1M'); // VP8 uses bitrate instead of CRF
			}
			if (videoCodec === 'prores_ks') {
				args.push('-profile:v', '3'); // ProRes HQ
			}

			// Audio codec
			args.push('-c:a', audioCodec);
			if (audioCodec === 'libopus') {
				args.push('-b:a', '128k');
			}

			args.push(outputName);

			await video.ffmpeg.exec(args);

			const data = await video.ffmpeg.readFile(outputName);
			const blob = new Blob([data as unknown as BlobPart], { type: currentFormat.mimeType });
			const url = URL.createObjectURL(blob);
			const size = typeof data === 'string' ? data.length : (data as Uint8Array).byteLength;

			video.saveResult(url, size);
		} catch (error) {
			console.error('Conversion failed:', error);
			video.error = 'Conversion failed. This codec combination may not be supported.';
			video.status = 'ready';
		}
	}
</script>

{#if !video.file}
	<div class="flex flex-1 flex-col items-center justify-center">
		<div class="max-w-2xl w-full">
			<FileUpload />
		</div>
	</div>
{:else}
	<div class="pb-20 space-y-6">
		<!-- Header -->
		<div
			class="p-4 card flex flex-col gap-3 top-0 justify-between sticky z-30 md:flex-row md:items-center"
		>
			<div class="min-w-0">
				<h2 class="text-lg text-base font-semibold truncate" title={video.file.name}>
					{video.file.name}
				</h2>
				<div class="text-sm text-muted flex flex-wrap gap-2 md:gap-3">
					<span>Input: {video.formatBytes(video.sourceSize)}</span>
					<span class="text-subtle">•</span>
					<span>Current: {video.extension.replace('.', '').toUpperCase()}</span>
					{#if video.resultSize > 0}
						<span class="text-subtle">•</span>
						<span class="text-green-600 font-medium dark:text-green-400">
							Output: {video.formatBytes(video.resultSize)}
						</span>
					{/if}
				</div>
			</div>
			<div class="flex flex-shrink-0 gap-2">
				{#if video.hasResult}
					<button class="text-sm btn-ghost" onclick={() => video.clearResult()}> Reset </button>
				{/if}
				<button
					class="text-sm btn-ghost text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
					onclick={() => video.unload()}
				>
					Change File
				</button>
			</div>
		</div>

		<div class="gap-6 grid grid-cols-1 items-start lg:gap-8 lg:grid-cols-3">
			<!-- Preview Column -->
			<div class="space-y-4 lg:col-span-2">
				<div class="rounded-xl bg-transparent">
					<VideoComparison
						bind:videoElement={videoEl}
						originalUrl={video.status === 'done' ? video.resultUrl : video.sourceUrl}
						mode="single"
						isProcessing={video.status === 'processing'}
						progress={video.progress}
						onloadedmetadata={handleLoadedMetadata}
					/>
				</div>
				{#if video.status === 'done'}
					<div class="text-sm text-green-600 font-medium text-center dark:text-green-400">
						Previewing Converted Video ({currentFormat.label})
					</div>
				{/if}
			</div>

			<!-- Settings Column -->
			<div class="space-y-6 ">
				<div class="p-5 card md:p-6">
					<h3 class="text-base font-bold mb-4">Convert Settings</h3>

					<div class="space-y-5">
						<!-- Output Format -->
						<fieldset>
							<legend class="text-sm text-base font-medium mb-2 block">Output Format</legend>
							<div class="gap-2 grid grid-cols-3">
								{#each Object.entries(formats) as [key, format] (key)}
									<button
										class={[
											'text-sm font-medium px-4 py-2.5 rounded-lg border-2 transition-all',
											outputFormat === key
												? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400'
												: 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 text-muted'
										]}
										onclick={() => (outputFormat = key as FormatKey)}
										disabled={video.status === 'processing'}
									>
										{format.label}
									</button>
								{/each}
							</div>
						</fieldset>

						<!-- Advanced Settings Toggle -->
						<button
							class="text-sm text-primary-600 font-medium flex gap-1 items-center dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
							onclick={() => (showAdvanced = !showAdvanced)}
						>
							<ChevronRight
								class={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
							/>
							Advanced Settings
						</button>

						{#if showAdvanced}
							<div class="p-4 rounded-lg bg-elevated space-y-4">
								<!-- Video Codec -->
								<div>
									<label for="video-codec" class="text-sm text-base font-medium mb-1.5 block">
										Video Codec
									</label>
									<select
										id="video-codec"
										value={videoCodec}
										onchange={(e) => (videoCodecOverride = e.currentTarget.value)}
										disabled={video.status === 'processing'}
										class="text-sm px-3 py-2 border border-surface-300 rounded-lg bg-base w-full focus:outline-none dark:border-surface-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
									>
										{#each currentFormat.videoCodecs as codec (codec.id)}
											<option value={codec.id}>{codec.name}</option>
										{/each}
									</select>
								</div>

								<!-- Audio Codec -->
								<div>
									<label for="audio-codec" class="text-sm text-base font-medium mb-1.5 block">
										Audio Codec
									</label>
									<select
										id="audio-codec"
										value={audioCodec}
										onchange={(e) => (audioCodecOverride = e.currentTarget.value)}
										disabled={video.status === 'processing'}
										class="text-sm px-3 py-2 border border-surface-300 rounded-lg bg-base w-full focus:outline-none dark:border-surface-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
									>
										{#each currentFormat.audioCodecs as codec (codec.id)}
											<option value={codec.id}>{codec.name}</option>
										{/each}
									</select>
								</div>

								<!-- Quality Slider (CRF) -->
								{#if ['libx264', 'libx265', 'libvpx-vp9'].includes(videoCodec)}
									<div>
										<div class="mb-1.5 flex items-end justify-between">
											<label for="quality" class="text-sm text-base font-medium">
												Quality (CRF)
											</label>
											<span
												class="text-sm text-primary-600 font-bold font-mono px-2 py-0.5 rounded bg-primary-500/15 dark:text-primary-400"
											>
												{quality}
											</span>
										</div>
										<input
											id="quality"
											type="range"
											min="18"
											max="35"
											bind:value={quality}
											disabled={video.status === 'processing'}
											class="appearance-none accent-primary-600 rounded-lg bg-surface-200 h-2 w-full cursor-pointer dark:bg-surface-700"
										/>
										<div class="text-xs text-subtle mt-1 flex justify-between">
											<span>Higher Quality</span>
											<span>Smaller Size</span>
										</div>
									</div>
								{/if}
							</div>
						{/if}

						<hr class="border-base" />

						<!-- Action Buttons -->
						{#if video.status === 'done'}
							<div class="space-y-2">
								<a
									href={video.resultUrl}
									download={video.downloadName(outputFormat)}
									class="text-white font-bold px-4 py-3 rounded-xl bg-green-600 flex gap-2 w-full shadow-sm transition-all items-center justify-center hover:bg-green-700 active:scale-98"
								>
									<Download class="h-5 w-5" />
									Download {currentFormat.label}
								</a>
								<button
									onclick={convert}
									class="text-sm text-primary-600 font-medium py-2 w-full dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
								>
									Convert Again
								</button>
							</div>
						{:else if video.status === 'processing'}
							<button
								disabled
								class="text-muted font-bold px-4 py-3 rounded-xl bg-muted flex gap-2 w-full cursor-not-allowed items-center justify-center"
							>
								<div
									class="border-2 border-surface-400 border-t-transparent rounded-full h-5 w-5 animate-spin"
								></div>
								Converting...
							</button>
						{:else}
							<button
								class="btn-primary py-3 flex gap-2 w-full items-center justify-center"
								onclick={convert}
							>
								<ArrowRightLeft class="h-5 w-5" />
								Convert to {currentFormat.label}
							</button>
						{/if}
					</div>
				</div>

				<!-- Format Info -->
				<div class="text-sm text-muted p-4 rounded-lg bg-elevated">
					{#if outputFormat === 'mp4'}
						<p>
							<strong class="text-base">MP4</strong> is the most widely supported format. Works everywhere.
						</p>
					{:else if outputFormat === 'webm'}
						<p>
							<strong class="text-base">WebM</strong> is optimized for web. Smaller files, great for streaming.
						</p>
					{:else if outputFormat === 'mov'}
						<p>
							<strong class="text-base">MOV</strong> is ideal for Apple devices and professional editing.
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
