<script lang="ts">
	import { Play, Pause } from 'lucide-svelte';

	let {
		duration,
		startTime = $bindable(0),
		endTime = $bindable(0),
		videoElement,
		onSeek,
		onTogglePlay
	}: {
		duration: number;
		startTime: number;
		endTime: number;
		videoElement?: HTMLVideoElement;
		onSeek?: (time: number) => void;
		onTogglePlay?: () => void;
	} = $props();

	let isPlaying = $state(false);

	// Sync playing state with video
	$effect(() => {
		if (videoElement) {
			const onPlay = () => (isPlaying = true);
			const onPause = () => (isPlaying = false);
			videoElement.addEventListener('play', onPlay);
			videoElement.addEventListener('pause', onPause);
			return () => {
				videoElement.removeEventListener('play', onPlay);
				videoElement.removeEventListener('pause', onPause);
			};
		}
	});

	let containerRef = $state<HTMLElement>();
	let canvasRefs = $state<HTMLCanvasElement[]>([]);
	let isDraggingStart = $state(false);
	let isDraggingEnd = $state(false);
	let isDraggingPlayhead = $state(false);
	let playheadTime = $state(0);
	let framesGenerated = $state(false);

	const FRAME_COUNT = 10;
	const FRAME_HEIGHT = 56;

	// Generate frame thumbnails when video is ready
	$effect(() => {
		if (videoElement && duration > 0 && !framesGenerated && canvasRefs.length === FRAME_COUNT) {
			generateFrames();
		}
	});

	async function generateFrames() {
		if (!videoElement || framesGenerated) return;

		const video = document.createElement('video');
		video.src = videoElement.src;
		video.crossOrigin = 'anonymous';
		video.muted = true;

		await new Promise<void>((resolve) => {
			video.onloadeddata = () => resolve();
			video.load();
		});

		for (let i = 0; i < FRAME_COUNT; i++) {
			const time = (i / FRAME_COUNT) * duration;
			video.currentTime = time;

			await new Promise<void>((resolve) => {
				video.onseeked = () => resolve();
			});

			const canvas = canvasRefs[i];
			if (canvas) {
				const ctx = canvas.getContext('2d');
				if (ctx) {
					const aspectRatio = video.videoWidth / video.videoHeight;
					const drawWidth = FRAME_HEIGHT * aspectRatio;
					canvas.width = drawWidth;
					canvas.height = FRAME_HEIGHT;
					ctx.drawImage(video, 0, 0, drawWidth, FRAME_HEIGHT);
				}
			}
		}

		framesGenerated = true;
	}

	function getPositionPercent(time: number) {
		return duration > 0 ? (time / duration) * 100 : 0;
	}

	function getTimeFromPosition(clientX: number) {
		if (!containerRef) return 0;
		const rect = containerRef.getBoundingClientRect();
		const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		return percent * duration;
	}

	function handleMouseDown(e: MouseEvent, type: 'start' | 'end' | 'playhead') {
		e.preventDefault();
		e.stopPropagation();
		if (type === 'start') isDraggingStart = true;
		else if (type === 'end') isDraggingEnd = true;
		else isDraggingPlayhead = true;
	}

	function handleTouchStart(e: TouchEvent, type: 'start' | 'end' | 'playhead') {
		e.preventDefault();
		e.stopPropagation();
		if (type === 'start') isDraggingStart = true;
		else if (type === 'end') isDraggingEnd = true;
		else isDraggingPlayhead = true;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDraggingStart && !isDraggingEnd && !isDraggingPlayhead) return;

		const time = getTimeFromPosition(e.clientX);

		if (isDraggingStart) {
			startTime = Math.max(0, Math.min(time, endTime - 0.1));
			onSeek?.(startTime);
		} else if (isDraggingEnd) {
			endTime = Math.max(startTime + 0.1, Math.min(time, duration));
			onSeek?.(endTime);
		} else if (isDraggingPlayhead) {
			playheadTime = Math.max(startTime, Math.min(time, endTime));
			onSeek?.(playheadTime);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDraggingStart && !isDraggingEnd && !isDraggingPlayhead) return;

		const touch = e.touches[0];
		const time = getTimeFromPosition(touch.clientX);

		if (isDraggingStart) {
			startTime = Math.max(0, Math.min(time, endTime - 0.1));
			onSeek?.(startTime);
		} else if (isDraggingEnd) {
			endTime = Math.max(startTime + 0.1, Math.min(time, duration));
			onSeek?.(endTime);
		} else if (isDraggingPlayhead) {
			playheadTime = Math.max(startTime, Math.min(time, endTime));
			onSeek?.(playheadTime);
		}
	}

	function handleMouseUp() {
		isDraggingStart = false;
		isDraggingEnd = false;
		isDraggingPlayhead = false;
	}

	function handleTouchEnd() {
		isDraggingStart = false;
		isDraggingEnd = false;
		isDraggingPlayhead = false;
	}

	function handleContainerClick(e: MouseEvent) {
		if (isDraggingStart || isDraggingEnd || isDraggingPlayhead) return;
		const time = getTimeFromPosition(e.clientX);
		if (time >= startTime && time <= endTime) {
			playheadTime = time;
			onSeek?.(time);
		}
	}

	// Global mouse event handlers
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
			window.addEventListener('touchmove', handleTouchMove);
			window.addEventListener('touchend', handleTouchEnd);
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
				window.removeEventListener('touchmove', handleTouchMove);
				window.removeEventListener('touchend', handleTouchEnd);
			};
		}
	});

	// Initialize endTime to duration (only when it hasn't been set)
	$effect.pre(() => {
		if (duration > 0 && endTime === 0) {
			endTime = duration;
		}
	});

	// Sync playhead with external video time updates
	$effect(() => {
		if (videoElement && !isDraggingPlayhead) {
			const updatePlayhead = () => {
				if (!isDraggingStart && !isDraggingEnd && !isDraggingPlayhead) {
					playheadTime = videoElement.currentTime;
				}
			};
			videoElement.addEventListener('timeupdate', updatePlayhead);
			return () => videoElement.removeEventListener('timeupdate', updatePlayhead);
		}
	});

	function formatTime(seconds: number) {
		if (!isFinite(seconds)) return '0:00.00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		const ms = Math.floor((seconds % 1) * 100);
		return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
	}

	// Derive positions for the selection box
	let startPercent = $derived(getPositionPercent(startTime));
	let endPercent = $derived(getPositionPercent(endTime));
	let playheadPercent = $derived(getPositionPercent(playheadTime));
</script>

<div class="space-y-3">
	<!-- Trim area with play button -->
	<div class="flex gap-3 items-center">
		<!-- Play/Pause button -->
		<button
			onclick={() => onTogglePlay?.()}
			class="rounded-xl bg-surface-100 flex flex-shrink-0 h-16 w-14 transition-all items-center justify-center dark:bg-surface-800 hover:bg-surface-200 active:scale-95 dark:hover:bg-surface-700"
			aria-label={isPlaying ? 'Pause' : 'Play'}
		>
			{#if isPlaying}
				<Pause class="text-base h-6 w-6" fill="currentColor" />
			{:else}
				<Play class="text-base h-6 w-6" fill="currentColor" />
			{/if}
		</button>

		<!-- Frame strip with trim handles - iPhone style -->
		<div
			bind:this={containerRef}
			class="rounded-xl bg-surface-900 flex-1 h-16 cursor-pointer select-none ring-1 ring-surface-200 relative overflow-hidden dark:bg-surface-950 dark:ring-surface-800"
			onclick={handleContainerClick}
			onkeydown={(e) => {
				if (e.key === 'ArrowLeft') {
					playheadTime = Math.max(startTime, playheadTime - 1);
					onSeek?.(playheadTime);
				}
				if (e.key === 'ArrowRight') {
					playheadTime = Math.min(endTime, playheadTime + 1);
					onSeek?.(playheadTime);
				}
			}}
			role="slider"
			tabindex="0"
			aria-label="Trim slider"
			aria-valuemin={0}
			aria-valuemax={duration}
			aria-valuenow={playheadTime}
		>
			<!-- Frame thumbnails -->
			<div class="flex h-full w-full inset-0 absolute">
				{#each Array.from({ length: FRAME_COUNT }, (_, i) => i) as i (i)}
					<div class="flex-1 h-full overflow-hidden">
						<canvas bind:this={canvasRefs[i]} class="h-full w-full object-cover"></canvas>
					</div>
				{/each}
			</div>

			<!-- Dimmed area before selection -->
			<div
				class="bg-black/70 h-full pointer-events-none left-0 top-0 absolute"
				style="width: {startPercent}%"
			></div>

			<!-- Dimmed area after selection -->
			<div
				class="bg-black/70 h-full pointer-events-none right-0 top-0 absolute"
				style="width: {100 - endPercent}%"
			></div>

			<!-- Selection frame with integrated handles -->
			<div
				class="flex h-full items-stretch top-0 absolute"
				style="left: {startPercent}%; width: {endPercent - startPercent}%"
			>
				<!-- Start handle (left accent bar) -->
				<div
					class="rounded-l-lg bg-primary-500 flex flex-shrink-0 h-full w-5 cursor-ew-resize items-center justify-center z-20 touch-none"
					class:ring-2={isDraggingStart}
					class:ring-white={isDraggingStart}
					onmousedown={(e) => handleMouseDown(e, 'start')}
					ontouchstart={(e) => handleTouchStart(e, 'start')}
					role="slider"
					tabindex="-1"
					aria-label="Start time handle"
					aria-valuenow={startTime}
				>
					<div class="rounded-full bg-primary-700 h-8 w-1"></div>
				</div>

				<!-- Middle area with top/bottom accent borders -->
				<div class="border-y-4 border-primary-500 flex-1 pointer-events-none"></div>

				<!-- End handle (right accent bar) -->
				<div
					class="rounded-r-lg bg-primary-500 flex flex-shrink-0 h-full w-5 cursor-ew-resize items-center justify-center z-20 touch-none"
					class:ring-2={isDraggingEnd}
					class:ring-white={isDraggingEnd}
					onmousedown={(e) => handleMouseDown(e, 'end')}
					ontouchstart={(e) => handleTouchStart(e, 'end')}
					role="slider"
					tabindex="-1"
					aria-label="End time handle"
					aria-valuenow={endTime}
				>
					<div class="rounded-full bg-primary-700 h-8 w-1"></div>
				</div>
			</div>

			<!-- Playhead -->
			<div
				class="h-full w-1 cursor-ew-resize top-0 absolute z-30 touch-none"
				style="left: {playheadPercent}%"
				onmousedown={(e) => handleMouseDown(e, 'playhead')}
				ontouchstart={(e) => handleTouchStart(e, 'playhead')}
				role="slider"
				tabindex="-1"
				aria-label="Playhead"
				aria-valuenow={playheadTime}
			>
				<div class="bg-white h-full w-full shadow-lg relative">
					<div
						class="rounded-full bg-white h-3 w-3 shadow-md left-1/2 top-0 absolute -translate-x-1/2 -translate-y-1/2"
					></div>
					<div
						class="rounded-full bg-white h-3 w-3 shadow-md translate-y-1/2 bottom-0 left-1/2 absolute -translate-x-1/2"
					></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Compact time inputs -->
	<div class="flex gap-2 items-center md:gap-3">
		<div class="flex flex-1 gap-2 items-center">
			<label for="start-time-input" class="text-xs text-muted font-medium">Start</label>
			<input
				id="start-time-input"
				type="number"
				step="0.1"
				min="0"
				max={endTime - 0.1}
				bind:value={startTime}
				onchange={() => onSeek?.(startTime)}
				class="text-sm text-base font-mono px-2 py-1.5 outline-none border border-base rounded-lg bg-base w-20 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
			/>
		</div>
		<div
			class="text-sm text-primary-700 font-medium px-3 py-1.5 rounded-lg bg-primary-50 dark:text-primary-300 dark:bg-primary-950/50"
		>
			{formatTime(endTime - startTime)}
		</div>
		<div class="flex flex-1 gap-2 items-center justify-end">
			<label for="end-time-input" class="text-xs text-muted font-medium">End</label>
			<input
				id="end-time-input"
				type="number"
				step="0.1"
				min={startTime + 0.1}
				max={duration}
				bind:value={endTime}
				onchange={() => onSeek?.(endTime)}
				class="text-sm text-base font-mono px-2 py-1.5 outline-none border border-base rounded-lg bg-base w-20 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
			/>
		</div>
	</div>
</div>
