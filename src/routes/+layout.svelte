<script>
	import TitleBar from "$lib/components/layout/TitleBar.svelte";
	import SideBar from "$lib/components/layout/SideBar.svelte";
	import { blur } from "svelte/transition";

	let { children, data } = $props();

</script>


<div class="flex flex-row w-full h-full">
	<SideBar url={data.url} />
	<div class="w-full h-full">
		<TitleBar />
		<div class="w-full h-[calc(100%-1.5rem)] bg-#181818 rounded-tl-lg overflow-hidden">
			{#key data.url}
			<div
				class="w-full h-full"
				in:blur={{ delay: 200, duration: 200 }}
				out:blur={{ duration: 200 }}
			>
				{@render children()}
			</div>
			{/key}
		</div>
	</div>
</div>