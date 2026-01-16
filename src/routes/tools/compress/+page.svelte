<script lang="ts">
	import { fetchFile } from '@ffmpeg/util';
	import { Download } from 'lucide-svelte';
	import FileSizeComparison from '$lib/components/FileSizeComparison.svelte';
	import VideoComparison from '$lib/components/VideoComparison.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { video } from '$lib/state/video-manager.svelte';
	import { onMount } from 'svelte';

	let crf = $state(28);
	let videoEl = $state<HTMLVideoElement>();

	onMount(() => {
		video.use('compress');
	});

	function handleLoadedMetadata() {
		if (videoEl?.duration && isFinite(videoEl.duration)) {
			video.duration = videoEl.duration;
		}
	}

	async function transcode() {
		if (!video.file || !video.ffmpeg) return;

		video.startProcessing();

		const ext = video.extension;
		const inputName = `input${ext}`;
		const outputName = `output${ext}`;

		const codec = ext === '.webm' ? 'libvpx-vp9' : 'libx264';
		const mimeType = ext === '.webm' ? 'video/webm' : video.mimeType;

		try {
			const response = await fetch(video.sourceUrl);
			const inputBlob = await response.blob();
			await video.ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

			await video.ffmpeg.exec(['-i', inputName, '-vcodec', codec, '-crf', String(crf), outputName]);

			const data = await video.ffmpeg.readFile(outputName);
			const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const size = typeof data === 'string' ? data.length : (data as Uint8Array).byteLength;

			if (size >= video.sourceSize * 0.95) {
				video.isOptimal = true;
			}

			video.saveResult(url, size);
		} catch (error) {
			console.error('Compression failed:', error);
			video.error = 'Compression failed. Please try again.';
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
	<div class="pb-28 space-y-6 lg:pb-8">
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
					{#if video.resultSize > 0}
						<span class="text-green-600 font-bold dark:text-green-400"
							>Output: {video.formatBytes(video.resultSize)}</span
						>
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

		<div class="gap-6 grid grid-cols-1 lg:gap-8 lg:grid-cols-3">
			<!-- Left Column: Player -->
			<div class="space-y-4 lg:col-span-2">
				<div class="rounded-xl bg-transparent">
					<VideoComparison
						bind:videoElement={videoEl}
						originalUrl={video.sourceUrl}
						compressedUrl={video.status === 'done' ? video.resultUrl : ''}
						isProcessing={video.status === 'processing'}
						progress={video.progress}
						onloadedmetadata={handleLoadedMetadata}
					/>
				</div>
			</div>

			<!-- Right Column: Settings (visible on desktop) -->
			<div class="hidden lg:block ">
				<div class="card p-6 sticky top-24">
					<h3 class="text-base font-bold mb-4">Compression Settings</h3>

					<div class="space-y-5">
						<FileSizeComparison
							originalSize={video.sourceSize}
							compressedSize={video.status === 'done' ? video.resultSize : 0}
							alreadyCompressed={video.isOptimal}
							isProcessing={video.status === 'processing'}
							progress={video.progress}
						/>

						<hr class="border-base" />

						<div>
							<div class="mb-2 flex items-end justify-between">
								<label for="crf-desktop" class="text-sm text-base font-medium block"
									>Quality Level (CRF)</label
								>
								<span
									class="text-sm text-primary-600 font-bold font-mono px-2 py-0.5 rounded bg-primary-500/15 dark:text-primary-400"
									>{crf}</span
								>
							</div>

							<input
								id="crf-desktop"
								type="range"
								min="18"
								max="35"
								bind:value={crf}
								disabled={video.status === 'processing'}
								class="appearance-none accent-primary-600 rounded-lg bg-surface-200 h-2 w-full cursor-pointer dark:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
							/>

							<div class="text-xs text-subtle mt-2 flex justify-between">
								<span>Higher Quality</span>
								<span>Smaller Size</span>
							</div>
						</div>

						<div>
							{#if video.status === 'processing'}
								<button
									disabled
									class="text-muted font-semibold px-4 py-3 rounded-xl bg-muted flex gap-2 w-full cursor-not-allowed items-center justify-center"
								>
									<div class="border-2 border-surface-400 border-t-transparent rounded-full h-5 w-5 animate-spin"></div>
									<span>Processing {video.progress.toFixed(0)}%</span>
								</button>
							{:else if video.status === 'done'}
								<a
									href={video.resultUrl}
									download={video.downloadName('compressed')}
									class="text-white font-semibold px-4 py-3 rounded-xl bg-green-600 flex gap-2 w-full shadow-sm transition-all items-center justify-center hover:bg-green-700 active:scale-98"
								>
									<Download class="h-5 w-5" />
									<span>Download Result</span>
								</a>
								<button
									onclick={transcode}
									class="btn-ghost text-sm mt-2 py-2 w-full"
								>
									Compress Again
								</button>
							{:else}
								<button class="btn-primary py-3 w-full" onclick={transcode}>
									Start Compression
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Mobile Bottom Bar -->
		<div class="fixed inset-x-0 bottom-0 p-4 bg-base border-t border-base z-40 lg:hidden">
			<div class="card p-4">
				{#if video.status === 'processing'}
					<button
						disabled
						class="text-muted font-semibold px-4 py-3.5 rounded-xl bg-muted flex gap-2 w-full cursor-not-allowed items-center justify-center"
					>
						<div class="border-2 border-surface-400 border-t-transparent rounded-full h-5 w-5 animate-spin"></div>
						<span>Processing {video.progress.toFixed(0)}%</span>
					</button>
				{:else if video.status === 'done'}
					<div class="flex gap-2">
						<a
							href={video.resultUrl}
							download={video.downloadName('compressed')}
							class="text-white font-semibold px-4 py-3.5 rounded-xl bg-green-600 flex gap-2 flex-1 shadow-sm transition-all items-center justify-center hover:bg-green-700 active:scale-98"
						>
							<Download class="h-5 w-5" />
							<span>Download</span>
						</a>
						<button onclick={transcode} class="btn-ghost px-4 py-3.5">
							Again
						</button>
					</div>
				{:else}
					<div class="flex gap-3 items-center">
						<div class="flex-1 flex items-center gap-2">
							<label for="crf-mobile" class="text-sm text-muted font-medium whitespace-nowrap">Quality</label>
							<input
								id="crf-mobile"
								type="range"
								min="18"
								max="35"
								bind:value={crf}
								class="appearance-none accent-primary-600 rounded-lg bg-surface-200 h-2 flex-1 cursor-pointer dark:bg-surface-700"
							/>
							<span class="text-sm text-primary-600 font-bold font-mono w-6 dark:text-primary-400">{crf}</span>
						</div>
						<button class="btn-primary py-3.5 px-6" onclick={transcode}>
							Compress
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
