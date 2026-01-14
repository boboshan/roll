<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Logo from '$lib/assets/logo.svg';

	onMount(() => {
		goto('/tools/compress');
	});
</script>

<div class="bg-elevated flex h-screen items-center justify-center">
	<div class="text-center">
		<div class="mx-auto mb-6 h-20 w-20">
			<img src={Logo} alt="Roll" class="h-full w-full" />
		</div>
		<h1 class="text-2xl text-base font-bold mb-2">Roll</h1>
		<p class="text-muted mb-6">Loading your workspace...</p>
		<div
			class="mx-auto border-3 border-primary-200 border-t-primary-500 rounded-full h-8 w-8 animate-spin dark:border-primary-800"
		></div>
	</div>
</div>
