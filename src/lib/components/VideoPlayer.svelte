<script lang="ts">
	let {
		src,
		videoElement = $bindable(),
		isProcessing = false,
		progress = 0,
		showTimeline = true,
		onloadedmetadata,
		onDurationChange,
		onSeek
	}: {
		src: string;
		videoElement?: HTMLVideoElement;
		isProcessing?: boolean;
		progress?: number;
		showTimeline?: boolean;
		onloadedmetadata?: () => void;
		onDurationChange?: (duration: number) => void;
		onSeek?: (time: number) => void;
	} = $props();

	let localVideo = $state<HTMLVideoElement>();

	// Sync videoElement binding
	$effect.pre(() => {
		if (localVideo) {
			videoElement = localVideo;
		}
	});

	let isPlaying = $state(false);
	let isMuted = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let isDraggingTimeline = $state(false);
	let timelineRef = $state<HTMLElement>();

	// Derive target time from progress
	let processingTargetTime = $derived(duration > 0 ? (progress / 100) * duration : 0);

	// Sync video frame with processing progress (side effect only)
	$effect(() => {
		if (isProcessing && localVideo && duration > 0) {
			localVideo.pause();
			localVideo.currentTime = processingTargetTime;
		}
	});

	// Sync isPlaying with video state
	$effect(() => {
		if (localVideo) {
			const onPlay = () => (isPlaying = true);
			const onPause = () => (isPlaying = false);
			localVideo.addEventListener('play', onPlay);
			localVideo.addEventListener('pause', onPause);
			return () => {
				localVideo?.removeEventListener('play', onPlay);
				localVideo?.removeEventListener('pause', onPause);
			};
		}
	});

	function togglePlay() {
		if (!localVideo) return;

		if (localVideo.paused) {
			localVideo.play();
		} else {
			localVideo.pause();
		}
	}

	function seekToPosition(e: MouseEvent, target: HTMLElement) {
		if (!localVideo) return;

		const rect = target.getBoundingClientRect();
		const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const newTime = percent * duration;

		currentTime = newTime;
		localVideo.currentTime = newTime;
		onSeek?.(newTime);
	}

	function handleTimelineMouseDown(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		if (!target || !localVideo) return;
		isDraggingTimeline = true;
		seekToPosition(e, target);
	}

	function updateTime() {
		if (localVideo && !isDraggingTimeline) {
			currentTime = localVideo.currentTime;
		}
	}

	function updateDuration() {
		if (localVideo && isFinite(localVideo.duration)) {
			duration = localVideo.duration;
			onloadedmetadata?.();
			onDurationChange?.(duration);
		}
	}

	function formatTime(seconds: number) {
		if (!isFinite(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	$effect(() => {
		if (localVideo) {
			localVideo.addEventListener('timeupdate', updateTime);
			localVideo.addEventListener('loadedmetadata', updateDuration);
			if (localVideo.duration) updateDuration();

			return () => {
				localVideo?.removeEventListener('timeupdate', updateTime);
				localVideo?.removeEventListener('loadedmetadata', updateDuration);
			};
		}
	});

	function handleWindowMouseUp() {
		isDraggingTimeline = false;
	}

	function handleWindowMouseMove(e: MouseEvent) {
		if (isDraggingTimeline && timelineRef) {
			seekToPosition(e, timelineRef);
		}
	}

	// External seek function for trim slider
	export function seek(time: number) {
		if (localVideo) {
			currentTime = time;
			localVideo.currentTime = time;
		}
	}
</script>

<svelte:window onmouseup={handleWindowMouseUp} onmousemove={handleWindowMouseMove} />

<div class="space-y-4">
	<!-- Video Container -->
	<div class="rounded-lg bg-gray-900 w-full aspect-video relative overflow-hidden">
		<video
			bind:this={localVideo}
			{src}
			class="h-full w-full object-contain"
			loop
			muted={isMuted}
			playsinline
		></video>

		{#if isProcessing}
			<div class="bg-black/50 flex flex-col items-center inset-0 justify-center absolute">
				<div
					class="mb-4 border-4 border-blue-600 border-t-transparent rounded-full h-12 w-12 animate-spin"
				></div>
				<p class="text-white font-medium">Processing... {progress.toFixed(0)}%</p>
			</div>
		{/if}
	</div>

	<!-- Video Controls -->
	<div class="p-3 border border-gray-200 rounded-xl bg-white shadow-sm">
		{#if isProcessing}
			<div class="w-full">
				<div class="text-sm text-gray-700 font-medium mb-2 flex items-center justify-between">
					<div class="flex gap-2 items-center">
						<div
							class="border-2 border-blue-600 border-t-transparent rounded-full h-4 w-4 animate-spin"
						></div>
						<span class="animate-pulse">Processing...</span>
					</div>
					<span class="text-blue-600 font-semibold">{progress.toFixed(0)}%</span>
				</div>
				<div class="rounded-full bg-gray-100 h-2 overflow-hidden">
					<div
						class="h-full from-blue-500 to-blue-600 bg-gradient-to-r"
						style="width: {progress}%"
					></div>
				</div>
			</div>
		{:else}
			<!-- Play/Pause Button and Timeline -->
			<div class="flex gap-3 items-center">
				<button
					onclick={togglePlay}
					class="text-white rounded-lg bg-gray-900 flex h-9 w-9 transition-all items-center justify-center hover:bg-gray-700 active:scale-95"
					aria-label={isPlaying ? 'Pause' : 'Play'}
				>
					{#if isPlaying}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<rect x="6" y="4" width="4" height="16" rx="1" />
							<rect x="14" y="4" width="4" height="16" rx="1" />
						</svg>
					{:else}
						<svg
							class="ml-0.5"
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path d="M8 5v14l11-7z" />
						</svg>
					{/if}
				</button>

				<!-- Time display -->
				<span class="text-xs text-gray-500 font-medium min-w-[3.5rem] tabular-nums">
					{formatTime(currentTime)}
				</span>

				{#if showTimeline}
					<!-- Timeline Scrubber -->
					<div
						bind:this={timelineRef}
						class="group rounded-full bg-gray-100 flex-1 h-1.5 cursor-pointer relative"
						onmousedown={handleTimelineMouseDown}
						role="slider"
						tabindex="0"
						aria-label="Seek video"
						aria-valuemin={0}
						aria-valuemax={duration || 100}
						aria-valuenow={currentTime}
						onkeydown={(e) => {
							if (!localVideo) return;
							if (e.key === 'ArrowRight') localVideo.currentTime += 5;
							if (e.key === 'ArrowLeft') localVideo.currentTime -= 5;
						}}
					>
						<!-- Track background on hover -->
						<div
							class="rounded-full h-full w-full transition-colors inset-0 absolute group-hover:bg-gray-200"
						></div>
						<!-- Progress bar -->
						<div
							class="rounded-full bg-gray-900 h-full relative z-10"
							style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
						></div>
						<!-- Thumb -->
						<div
							class="rounded-full bg-gray-900 h-3 w-3 ring-2 ring-white shadow-md top-1/2 absolute -translate-x-1/2 -translate-y-1/2"
							class:scale-125={isDraggingTimeline}
							class:transition-transform={!isDraggingTimeline}
							class:group-hover:scale-125={!isDraggingTimeline}
							style="left: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
						></div>
					</div>

					<!-- Duration display -->
					<span class="text-xs text-gray-500 font-medium text-right min-w-[3.5rem] tabular-nums">
						{formatTime(duration)}
					</span>
				{/if}

				<!-- Mute/Unmute Button -->
				<button
					onclick={() => (isMuted = !isMuted)}
					class="text-gray-500 rounded-lg flex h-9 w-9 transition-all items-center justify-center hover:text-gray-700 hover:bg-gray-100 active:scale-95"
					aria-label={isMuted ? 'Unmute' : 'Mute'}
				>
					{#if isMuted}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M11 5 6 9H2v6h4l5 4V5Z" />
							<line x1="22" x2="16" y1="9" y2="15" />
							<line x1="16" x2="22" y1="9" y2="15" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M11 5 6 9H2v6h4l5 4V5Z" />
							<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
							<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
						</svg>
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>
