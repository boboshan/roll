<script>
	import TitleBar from "$lib/components/layout/TitleBar.svelte";
  import SideBar from "$lib/components/layout/SideBar.svelte";

	let { children } = $props();

</script>

<TitleBar />

<div class="flex flex-row w-full mt-6 h-[calc(100vh-1.5rem)]">
  <SideBar />
	<div class="w-full h-full bg-#181818 rounded-tl-lg p-4 overflow-auto">
		{@render children()}
	</div>
</div>


