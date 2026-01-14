<script lang="ts">
	import RollingNumber from './RollingNumber.svelte';
	import { ArrowRight, Check, AlertTriangle } from 'lucide-svelte';

	let {
		originalSize,
		compressedSize,
		alreadyCompressed = false,
		isProcessing = false,
		progress = 0
	}: {
		originalSize: number;
		compressedSize: number; // Final compressed size (0 if not done)
		alreadyCompressed?: boolean;
		isProcessing?: boolean;
		progress?: number;
	} = $props();

	// Parse bytes to value and unit
	function parseBytes(bytes: number) {
		if (bytes === 0) return { value: 0, unit: 'B' };
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return {
			value: parseFloat((bytes / Math.pow(k, i)).toFixed(2)),
			unit: sizes[i]
		};
	}

	// For compressed size:
	// If processing, estimatedSize grows from 0 to finalish.
	// But we really just want to show "Current Size" growing.
	// We'll estimate current file size based on progress relative to original * expected_ratio?
	// The user said: "size from zero instead from init size... it will become the final size when done".
	// Since we don't know the final size until done, we can't perfectly animate to it.
	// However, we can animate to an *estimated* final size (e.g. 60% of original) during processing.
	// When done, it snaps/rolls to the real final size.

	const estimatedFinalSize = $derived(originalSize * 0.6); // Guess 60% compression

	const currentDisplayBytes = $derived(
		isProcessing ? estimatedFinalSize * (progress / 100) : compressedSize
	);

	// Determine unit to lock to avoid jumping units during roll?
	// Actually, locking to "MB" is good if original is MB.
	// Let's force use the unit of the Original size for stability, unless it's too small.
	function parseBytesFixedUnit(bytes: number, fixedUnitIndex: number) {
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const val = bytes / Math.pow(k, fixedUnitIndex);
		return {
			value: val,
			unit: sizes[fixedUnitIndex]
		};
	}

	// Get index of original size unit
	const originalUnitIndex = $derived(
		Math.floor(Math.log(Math.max(originalSize, 1)) / Math.log(1024))
	);

	// Display value linked to original unit for consistency
	const display = $derived(
		currentDisplayBytes > 0
			? parseBytesFixedUnit(currentDisplayBytes, originalUnitIndex)
			: { value: 0, unit: parseBytes(originalSize).unit }
	);

	// Original value in same unit
	const originalDisplay = $derived(parseBytesFixedUnit(originalSize, originalUnitIndex));

	// Calculate percentage saved
	const percentSaved = $derived(
		!isProcessing && compressedSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0
	);

	// Check if video can't be compressed further (0% or negative savings)
	const cannotCompressFurther = $derived(!isProcessing && compressedSize > 0 && percentSaved <= 0);
</script>

<div class="flex gap-4 items-end md:gap-8">
	<!-- Original Size -->
	<div class="flex-1">
		<p class="text-xs text-muted tracking-wide font-medium mb-1 uppercase">Original</p>
		<div class="text-2xl text-base md:text-3xl">
			<RollingNumber value={originalDisplay.value} unit={originalDisplay.unit} />
		</div>
	</div>

	<!-- Arrow -->
	<div class="text-subtle pb-2">
		<ArrowRight class="h-6 w-6" />
	</div>

	<!-- Compressed Size -->
	<div class="flex-1">
		<p class="text-xs text-muted tracking-wide font-medium mb-1 uppercase">Compressed</p>
		{#if compressedSize > 0 || isProcessing}
			<div class="flex gap-3 items-baseline">
				<div
					class={[
						'text-2xl md:text-3xl transition-colors duration-300 tabular-nums',
						isProcessing && 'text-primary-600 dark:text-primary-400',
						!isProcessing && !alreadyCompressed && 'text-green-600 dark:text-green-400',
						!isProcessing && alreadyCompressed && 'text-base'
					]}
				>
					<RollingNumber value={display.value} unit={display.unit} />
				</div>
			</div>
		{:else}
			<div class="text-2xl text-subtle font-bold md:text-3xl">—</div>
		{/if}
	</div>
</div>

<!-- Savings Badge -->
{#if !isProcessing && compressedSize > 0}
	<div class="mt-4 flex gap-2 items-center justify-center">
		{#if alreadyCompressed || cannotCompressFurther}
			<div
				class="animate-in fade-in text-sm text-amber-700 font-semibold px-4 py-2 border-2 border-amber-400 rounded-full bg-amber-50 inline-flex gap-2 duration-300 items-center dark:text-amber-300 dark:border-amber-600 dark:bg-amber-950/50"
			>
				<AlertTriangle class="h-[18px] w-[18px]" />
				Video already optimized
			</div>
		{:else}
			<div
				class="animate-in fade-in zoom-in text-green-700 px-5 py-3 border-2 border-green-400 rounded-full bg-green-50 inline-flex gap-2 duration-500 items-center dark:text-green-300 dark:border-green-600 dark:bg-green-950/50"
				style="animation-delay: 1.5s; animation-fill-mode: both;"
			>
				<Check class="h-5 w-5" />
				<span class="text-xl font-bold md:text-2xl">{percentSaved}% Smaller</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes zoom-in {
		from {
			transform: scale(0.8);
		}
		to {
			transform: scale(1);
		}
	}

	.animate-in {
		animation-duration: 0.5s;
		animation-timing-function: ease-out;
		animation-fill-mode: both;
	}

	.fade-in {
		animation-name: fade-in;
	}

	.zoom-in {
		animation-name: fade-in, zoom-in;
	}
</style>
