<script lang="ts">
	import { fetchFile } from '@ffmpeg/util';
	import { Download, VolumeX } from 'lucide-svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import VideoComparison from '$lib/components/VideoComparison.svelte';
	import { video } from '$lib/state/video-manager.svelte';
	import { onMount } from 'svelte';

	let videoEl = $state<HTMLVideoElement>();

	onMount(() => {
		video.use('mute');
	});

	function handleLoadedMetadata() {
		if (videoEl?.duration && isFinite(videoEl.duration)) {
			video.duration = videoEl.duration;
		}
	}

	async function removeAudio() {
		if (!video.file || !video.ffmpeg) return;

		video.startProcessing();

		const ext = video.extension;
		const inputName = `input${ext}`;
		const outputName = `output${ext}`;

		try {
			const response = await fetch(video.sourceUrl);
			const inputBlob = await response.blob();
			await video.ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

			await video.ffmpeg.exec(['-i', inputName, '-c', 'copy', '-an', outputName]);

			const data = await video.ffmpeg.readFile(outputName);
			const blob = new Blob([data as unknown as BlobPart], { type: video.mimeType });
			const url = URL.createObjectURL(blob);
			const size = typeof data === 'string' ? data.length : (data as Uint8Array).byteLength;

			video.saveResult(url, size);
		} catch (error) {
			console.error('Remove audio failed:', error);
			video.error = 'Failed to remove audio.';
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
						Previewing Muted Video
					</div>
				{/if}
			</div>

			<!-- Actions Column -->
			<div class="space-y-6">
				<div class="p-5 card md:p-6">
					<h3 class="text-base font-bold mb-4">Remove Audio</h3>

					<div
						class="text-sm text-primary-700 mb-6 p-4 rounded-xl bg-primary-500/10 dark:text-primary-300"
					>
						<p>
							This tool removes the audio track from your video without re-encoding the video
							stream. The visual quality remains exactly the same.
						</p>
					</div>

					{#if video.status === 'done'}
						<div
							class="text-green-700 mb-4 p-4 text-center rounded-xl bg-green-50 dark:text-green-300 dark:bg-green-950/50"
						>
							<p class="font-medium">Audio Removed Successfully!</p>
						</div>
						<a
							href={video.resultUrl}
							download={video.downloadName('muted')}
							class="text-white font-bold px-4 py-3 rounded-xl bg-green-600 flex gap-2 w-full shadow-sm transform transition-all items-center justify-center hover:bg-green-700 active:scale-98"
						>
							<Download class="h-5 w-5" />
							Download Video
						</a>
						<button
							onclick={removeAudio}
							class="text-sm text-primary-600 font-medium mt-2 py-2 w-full dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
						>
							Process Again
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
							class="text-white font-bold px-4 py-3 rounded-xl bg-red-600 flex gap-2 w-full shadow-sm transform transition-all items-center justify-center hover:bg-red-700 active:scale-98"
							onclick={removeAudio}
						>
							<VolumeX class="h-5 w-5" />
							Remove Audio
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
