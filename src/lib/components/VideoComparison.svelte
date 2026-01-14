<script lang="ts">
	import { Play, Pause, Volume2, VolumeX, ChevronsLeftRight } from 'lucide-svelte';

	let {
		originalUrl,
		compressedUrl = '',
		mode = 'compare',
		videoElement = $bindable(),
		isProcessing = false,
		progress = 0,
		onloadedmetadata
	}: {
		originalUrl: string;
		compressedUrl?: string;
		mode?: 'compare' | 'single';
		videoElement?: HTMLVideoElement;
		isProcessing?: boolean;
		progress?: number;
		onloadedmetadata?: () => void;
	} = $props();

	let sliderPos = $state(50);
	let localVideo1 = $state<HTMLVideoElement>();
	let comparisonVideo2 = $state<HTMLVideoElement>();

	// Sync videoElement binding when localVideo1 changes
	$effect.pre(() => {
		if (localVideo1) {
			videoElement = localVideo1;
		}
	});

	let isPlaying = $state(false);
	let isMuted = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let isDraggingSlider = $state(false);
	let isDraggingTimeline = $state(false);

	// Derive target time from progress
	let processingTargetTime = $derived(duration > 0 ? (progress / 100) * duration : 0);

	// Sync video frame with processing progress (side effect only)
	$effect(() => {
		if (isProcessing && localVideo1 && duration > 0) {
			localVideo1.pause();
			localVideo1.currentTime = processingTargetTime;
		}
	});

	// Sync isPlaying with video state
	$effect(() => {
		if (localVideo1) {
			const onPlay = () => (isPlaying = true);
			const onPause = () => (isPlaying = false);
			localVideo1.addEventListener('play', onPlay);
			localVideo1.addEventListener('pause', onPause);
			return () => {
				localVideo1?.removeEventListener('play', onPlay);
				localVideo1?.removeEventListener('pause', onPause);
			};
		}
	});

	function togglePlay() {
		if (!localVideo1) return;

		if (localVideo1.paused) {
			localVideo1.play();
			if (comparisonVideo2) {
				comparisonVideo2.currentTime = localVideo1.currentTime;
				comparisonVideo2.play();
			}
		} else {
			localVideo1.pause();
			comparisonVideo2?.pause();
		}
	}

	function handleSliderMouseDown(e: MouseEvent) {
		if (mode === 'single') return;
		isDraggingSlider = true;
		updateSliderPosition(e);
	}

	function handleSliderMouseMove(e: MouseEvent) {
		if (!isDraggingSlider || mode === 'single') return;
		updateSliderPosition(e);
	}

	function updateSliderPosition(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		if (!target) return;
		const rect = target.getBoundingClientRect();
		sliderPos = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
	}

	function seekToPosition(e: MouseEvent, target: HTMLElement) {
		if (!localVideo1) return;
		if (mode === 'compare' && !comparisonVideo2) return;

		const rect = target.getBoundingClientRect();
		const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const newTime = percent * duration;

		// Update UI immediately for responsiveness
		currentTime = newTime;

		// Then update the video element
		localVideo1.currentTime = newTime;
		if (mode === 'compare' && comparisonVideo2) {
			comparisonVideo2.currentTime = newTime;
		}
	}

	let timelineRef = $state<HTMLElement>();

	function handleTimelineMouseDown(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		if (!target || !localVideo1) return;
		isDraggingTimeline = true;
		seekToPosition(e, target);
	}

	function updateTime() {
		if (localVideo1 && !isDraggingTimeline) {
			currentTime = localVideo1.currentTime;
		}
	}

	function updateDuration() {
		if (localVideo1) {
			duration = localVideo1.duration;
			onloadedmetadata?.();
		}
	}

	function formatTime(seconds: number) {
		if (!isFinite(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	$effect(() => {
		if (localVideo1) {
			localVideo1.addEventListener('timeupdate', updateTime);
			localVideo1.addEventListener('loadedmetadata', updateDuration);
			// Also call updateDuration immediately just in case
			if (localVideo1.duration) updateDuration();

			return () => {
				localVideo1?.removeEventListener('timeupdate', updateTime);
				localVideo1?.removeEventListener('loadedmetadata', updateDuration);
			};
		}
	});

	function handleWindowMouseUp() {
		isDraggingSlider = false;
		isDraggingTimeline = false;
	}

	function handleWindowMouseMove(e: MouseEvent) {
		if (isDraggingTimeline && timelineRef) {
			seekToPosition(e, timelineRef);
		}
	}
</script>

<svelte:window onmouseup={handleWindowMouseUp} onmousemove={handleWindowMouseMove} />

<div class="space-y-4">
	<!-- Video Comparison Container -->
	<div
		class="outline-none rounded-2xl bg-surface-900 w-full aspect-video select-none ring-1 ring-surface-200 relative overflow-hidden dark:bg-surface-950 dark:ring-surface-800"
		onmousedown={handleSliderMouseDown}
		onmousemove={handleSliderMouseMove}
		role="slider"
		aria-valuenow={sliderPos}
		tabindex="0"
	>
		{#if mode === 'compare' && compressedUrl}
			<!-- Compressed (Right/Bottom Layer) -->
			<video
				bind:this={comparisonVideo2}
				src={compressedUrl}
				poster=""
				class="h-full w-full pointer-events-none left-0 top-0 absolute object-contain"
				loop
				muted
				playsinline
			></video>
			<!-- Note: comparisonVideo2 always muted to avoid audio overlap -->

			<!-- Original (Left/Top Layer) -->
			<div
				class="h-full w-full pointer-events-none left-0 top-0 absolute"
				style="clip-path: polygon(0 0, {sliderPos}% 0, {sliderPos}% 100%, 0 100%);"
			>
				<video
					bind:this={localVideo1}
					src={originalUrl}
					class="h-full w-full left-0 top-0 absolute object-contain"
					loop
					muted={isMuted}
					playsinline
				></video>
			</div>

			<!-- Slider Line -->
			<div
				class="bg-white w-0.5 pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)] bottom-0 top-0 absolute z-10"
				style="left: {sliderPos}%"
			>
				<div
					class="text-surface-600 rounded-full bg-white flex h-8 w-8 cursor-ew-resize pointer-events-auto shadow-lg transform items-center left-1/2 top-1/2 justify-center absolute -translate-x-1/2 -translate-y-1/2"
				>
					<ChevronsLeftRight class="h-4 w-4" />
				</div>
			</div>

			<!-- Labels -->
			<div
				class="text-xs text-white font-medium px-2.5 py-1 rounded-lg bg-black/60 pointer-events-none bottom-3 left-3 absolute z-20 backdrop-blur-sm"
			>
				Original
			</div>
			<div
				class="text-xs text-white font-medium px-2.5 py-1 rounded-lg bg-black/60 pointer-events-none bottom-3 right-3 absolute z-20 backdrop-blur-sm"
			>
				Compressed
			</div>
		{:else}
			<!-- Single Video Mode -->
			<video
				bind:this={localVideo1}
				src={originalUrl}
				class="h-full w-full left-0 top-0 absolute object-contain"
				loop
				muted={isMuted}
				playsinline
			></video>
		{/if}
	</div>

	<!-- Video Controls -->
	<div class="p-3 card">
		{#if isProcessing}
			<div class="w-full">
				<div class="text-sm text-base font-medium mb-2 flex items-center justify-between">
					<div class="flex gap-2 items-center">
						<div
							class="border-2 border-primary-500 border-t-transparent rounded-full h-4 w-4 animate-spin"
						></div>
						<span class="animate-pulse">Processing...</span>
					</div>
					<span class="text-primary-600 font-semibold dark:text-primary-400"
						>{progress.toFixed(0)}%</span
					>
				</div>
				<div class="rounded-full bg-surface-100 h-2 overflow-hidden dark:bg-surface-800">
					<div
						class="h-full transition-all duration-300 from-primary-500 to-primary-600 bg-gradient-to-r"
						style="width: {progress}%"
					></div>
				</div>
			</div>
		{:else}
			<!-- Play/Pause Button and Timeline -->
			<div class="flex gap-3 items-center">
				<button
					onclick={togglePlay}
					class="text-white rounded-xl bg-primary-600 flex h-9 w-9 transition-all items-center justify-center hover:bg-primary-700 active:scale-95"
					aria-label={isPlaying ? 'Pause' : 'Play'}
				>
					{#if isPlaying}
						<Pause class="h-4 w-4" fill="currentColor" />
					{:else}
						<Play class="ml-0.5 h-4 w-4" fill="currentColor" />
					{/if}
				</button>

				<!-- Time display -->
				<span class="text-xs text-muted font-medium min-w-[3.5rem] tabular-nums">
					{formatTime(currentTime)}
				</span>

				<!-- Timeline Scrubber -->
				<div
					bind:this={timelineRef}
					class="group rounded-full bg-surface-100 flex-1 h-1.5 cursor-pointer relative dark:bg-surface-800"
					onmousedown={handleTimelineMouseDown}
					role="slider"
					tabindex="0"
					aria-label="Seek video"
					aria-valuemin="0"
					aria-valuemax={duration || 100}
					aria-valuenow={currentTime}
					onkeydown={(e) => {
						if (!localVideo1) return;
						if (e.key === 'ArrowRight') localVideo1.currentTime += 5;
						if (e.key === 'ArrowLeft') localVideo1.currentTime -= 5;
					}}
				>
					<!-- Track background on hover -->
					<div
						class="rounded-full h-full w-full transition-colors inset-0 absolute group-hover:bg-surface-200 dark:group-hover:bg-surface-700"
					></div>
					<!-- Progress bar -->
					<div
						class="rounded-full bg-primary-600 h-full relative z-10"
						style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
					></div>
					<!-- Thumb -->
					<div
						class={[
							'rounded-full bg-primary-600 h-3 w-3 ring-2 ring-white dark:ring-surface-900 shadow-md active:scale-110 top-1/2 absolute -translate-x-1/2 -translate-y-1/2',
							!isDraggingTimeline && 'hover:scale-125 transition-transform'
						]}
						style="left: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
					></div>
				</div>

				<!-- Duration display -->
				<span class="text-xs text-muted font-medium text-right min-w-[3.5rem] tabular-nums">
					{formatTime(duration)}
				</span>

				<!-- Mute/Unmute Button -->
				<button
					onclick={() => (isMuted = !isMuted)}
					class="hover-bg text-muted rounded-xl flex h-9 w-9 transition-all items-center justify-center hover:text-base active:scale-95"
					aria-label={isMuted ? 'Unmute' : 'Mute'}
				>
					{#if isMuted}
						<VolumeX class="h-[18px] w-[18px]" />
					{:else}
						<Volume2 class="h-[18px] w-[18px]" />
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>
