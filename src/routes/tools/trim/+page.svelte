<script lang="ts">
	import { fetchFile } from '@ffmpeg/util';
	import { Download, Scissors } from 'lucide-svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import TrimSlider from '$lib/components/TrimSlider.svelte';
	import { video } from '$lib/state/video-manager.svelte';
	import { onMount } from 'svelte';

	let videoEl = $state<HTMLVideoElement>();
	let startTime = $state(0);
	let endTime = $state(0);
	let duration = $state(0);

	onMount(() => {
		video.use('trim');
	});

	function handleLoadedMetadata() {
		if (videoEl?.duration && isFinite(videoEl.duration)) {
			duration = videoEl.duration;
			endTime = videoEl.duration;
			video.duration = videoEl.duration;
		}
	}

	function handleSeek(time: number) {
		if (videoEl) {
			videoEl.currentTime = time;
		}
	}

	function togglePlay() {
		if (!videoEl) return;
		if (videoEl.paused) {
			videoEl.play();
		} else {
			videoEl.pause();
		}
	}

	function formatDuration(seconds: number) {
		if (!isFinite(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	async function trimVideo() {
		if (!video.file || !video.ffmpeg) return;

		video.startProcessing();

		const ext = video.extension;
		const inputName = `input${ext}`;
		const outputName = `output${ext}`;

		try {
			const response = await fetch(video.sourceUrl);
			const inputBlob = await response.blob();
			await video.ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

			// Calculate duration for progress
			const trimDuration = endTime - startTime;
			video.duration = trimDuration;

			await video.ffmpeg.exec([
				'-i',
				inputName,
				'-ss',
				String(startTime),
				'-to',
				String(endTime),
				'-c',
				'copy',
				outputName
			]);

			const data = await video.ffmpeg.readFile(outputName);
			const blob = new Blob([data as unknown as BlobPart], { type: video.mimeType });
			const url = URL.createObjectURL(blob);
			const size = typeof data === 'string' ? data.length : (data as Uint8Array).byteLength;

			video.saveResult(url, size);
		} catch (error) {
			console.error('Trim failed:', error);
			video.error = 'Failed to trim video.';
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
					<span>Duration: {formatDuration(duration)}</span>
					<span class="text-accent-600 font-medium dark:text-accent-400">
						Selection: {formatDuration(endTime - startTime)}
					</span>
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
				<!-- Video Preview -->
				<div class="rounded-xl bg-surface-900 aspect-video relative overflow-hidden">
					<video
						bind:this={videoEl}
						src={video.status === 'done' ? video.resultUrl : video.sourceUrl}
						class="h-full w-full object-contain"
						onloadedmetadata={handleLoadedMetadata}
						muted
						playsinline
						loop
					></video>

					{#if video.status === 'processing'}
						<div class="bg-black/50 flex flex-col items-center inset-0 justify-center absolute">
							<div
								class="mb-4 border-4 border-accent-400 border-t-transparent rounded-full h-12 w-12 animate-spin"
							></div>
							<p class="text-white font-medium">Trimming... {video.progress.toFixed(0)}%</p>
						</div>
					{/if}
				</div>

				{#if video.status === 'done'}
					<div class="text-sm text-green-600 font-medium text-center dark:text-green-400">
						Previewing Trimmed Video
					</div>
				{:else if video.status !== 'processing'}
					<!-- Trim Slider with integrated play button -->
					<TrimSlider
						{duration}
						bind:startTime
						bind:endTime
						videoElement={videoEl}
						onSeek={handleSeek}
						onTogglePlay={togglePlay}
					/>
				{/if}
			</div>

			<!-- Actions Column -->
			<div class="space-y-6">
				<div class="p-5 card md:p-6">
					<h3 class="text-base font-bold mb-4">Trim Video</h3>

					<div class="text-sm text-muted mb-6">
						<p>Drag the orange handles to select the portion you want to keep.</p>
					</div>

					{#if video.status === 'done'}
						<div
							class="text-green-700 mb-4 p-4 text-center rounded-xl bg-green-50 dark:text-green-300 dark:bg-green-950/50"
						>
							<p class="font-medium">Video Trimmed Successfully!</p>
						</div>
						<a
							href={video.resultUrl}
							download={video.downloadName('trimmed')}
							class="text-white font-bold px-4 py-3 rounded-xl bg-green-600 flex gap-2 w-full shadow-sm transform transition-all items-center justify-center hover:bg-green-700 active:scale-98"
						>
							<Download class="h-5 w-5" />
							Download Trimmed Video
						</a>
						<button
							onclick={() => {
								video.clearResult();
								endTime = duration;
								startTime = 0;
							}}
							class="text-sm text-primary-600 font-medium mt-2 py-2 w-full dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
						>
							Trim Again
						</button>
					{:else if video.status === 'processing'}
						<button
							disabled
							class="text-muted font-bold px-4 py-3 rounded-xl bg-muted flex gap-2 w-full cursor-not-allowed items-center justify-center"
						>
							<div
								class="border-2 border-surface-400 border-t-transparent rounded-full h-5 w-5 animate-spin"
							></div>
							Processing
						</button>
					{:else}
						<button
							class="btn-accent py-3 flex gap-2 w-full items-center justify-center"
							onclick={trimVideo}
							disabled={endTime - startTime < 0.1}
						>
							<Scissors class="h-5 w-5" />
							Trim Video
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
