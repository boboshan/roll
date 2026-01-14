<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let { value = 0, unit = '' } = $props();

	const smoothValue = Tween.of(() => value, {
		duration: 1000,
		easing: cubicOut
	});

	// Split formatted number into digits
	let digits = $derived(smoothValue.current.toFixed(1).split(''));
	const numbers = Array.from({ length: 10 }, (_, i) => i);
</script>

<div class="font-bold font-mono inline-flex items-baseline">
	<div class="leading-none flex h-[1em] overflow-hidden">
		{#each digits as digit, i (i)}
			{#if digit === '.'}
				<span>.</span>
			{:else}
				<div class="h-[1em] w-[0.6em] relative">
					<div
						class="flex flex-col transition-transform duration-300 left-0 top-0 absolute"
						style="transform: translateY(-{parseInt(digit) * 10}%)"
					>
						{#each numbers as n (n)}
							<span class="flex h-[1em] items-center justify-center">{n}</span>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>
	{#if unit}
		<span class="text-sm text-gray-500 ml-1 uppercase">{unit}</span>
	{/if}
</div>
