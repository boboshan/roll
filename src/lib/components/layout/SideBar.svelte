<script>
	import { page } from "$app/stores";
	import { slide } from "svelte/transition";
	import { navLinks } from "$lib/config";
	import Menu from "$lib/icons/Menu.svelte";
	import Setting from "$lib/icons/Setting.svelte";

	let sidebar = $state({
		open: false,
		hovered: "",
	});

	let innerWidth = $state();

	let currentIndex = 0;
	let previousIndex = 0;

	let activeLink = $derived.by(() => {
		const newIndex = navLinks.findIndex(
			(link) => link.href === $page.url.pathname
		);
		if (newIndex !== currentIndex) {
			previousIndex = currentIndex;
			currentIndex = newIndex;
		}
		return {
			previousIndex,
			currentIndex,
		};
	});

	function toggleMenu() {
		sidebar.open = !sidebar.open;
	}

	function handleResize() {
		if (innerWidth > 1024 && !sidebar.open) {
			sidebar.open = true;
		}
		if (innerWidth < 1024 && sidebar.open) {
			sidebar.open = false;
		}
	}

	let tooltipPosition = $state({ top: "0px", left: "0px" });

	function getTooltipPosition(e) {
		const rect = e.target.getBoundingClientRect();
		return {
			top: `${rect.top + window.scrollY + rect.height / 2}px`,
			left: `${rect.right + window.scrollX + 10}px`,
		};
	}
</script>

<svelte:window bind:innerWidth onresize={handleResize} />

<aside
	data-tauri-drag-region
	class="shrink-0 flex flex-col justify-between gap-1 h-full pb-1 px-1 transition-all duration-300 ease-in-out"
	class:sidebar-open={sidebar.open}
	class:sidebar-close={!sidebar.open}
>
	<nav class="flex flex-col select-none gap-1">
		<button
			class="group flex justify-center items-center w-10 h-9 px-1 py-1.5 rounded-md bg-inherit hover:bg-background-70 active:bg-background-80 transition-colors transition-transform duration-100 text-center"
			onclick={toggleMenu}
		>
			<Menu
				width="18px"
				height="18px"
				class="group-active:scale-x-40 transition-transform duration-100 ease-in-out"
			/>
		</button>
		{#each navLinks as { href, label, icon: Icon }, index}
			<a
				{href}
				onmouseenter={(e) => {
					sidebar.hovered = label;
					tooltipPosition = getTooltipPosition(e);
				}}
				onmouseleave={() => (sidebar.hovered = "")}
				data-current={activeLink.currentIndex === index}
				class="relative px-1 py-1.5 rounded-md transition-colors transition-transform duration-100 hover:bg-background-70 data-[current=true]:bg-background-70 data-[current=true]:hover:not-active:bg-background-80 active:before:bg-blue-8 before:(absolute content-empty left--0.5 w-1 rounded bg-blue-5)"
				class:indicator-from-top={activeLink.currentIndex === index
					? activeLink.previousIndex <= activeLink.currentIndex
					: activeLink.previousIndex === index
						? activeLink.previousIndex >= activeLink.currentIndex
						: false}
				class:indicator-from-bottom={activeLink.currentIndex === index
					? activeLink.previousIndex > activeLink.currentIndex
					: activeLink.previousIndex === index
						? activeLink.previousIndex < activeLink.currentIndex
						: false}
			>
				<div class="w-full overflow-hidden whitespace-nowrap">
					<span
						class="inline-flex justify-center items-center vertical-top w-8 h-6"
					>
						<Icon width="18px" height="18px" />
					</span>
					{#if sidebar.open}
						<span
							class="text-sm vertical-top leading-6"
							transition:slide={{ duration: 300 }}
							>{label}
						</span>
					{/if}
				</div>
			</a>
		{/each}
	</nav>
	<button
		class="mt-a flex justify-center items-center vertical-top w-10 h-9 px-1 py-1.5 rounded-md bg-inherit hover:bg-background-70 active:bg-background-80 transition-colors transition-transform duration-100 text-center"
	>
		<Setting width="18px" height="18px" />
	</button>
</aside>

{#if !sidebar.open && sidebar.hovered}
	<div
		class="fixed z-50 px-3 py-2 translate-y--50% text-sm bg-background-80 rounded-md"
		style="top: {tooltipPosition.top}; left: {tooltipPosition.left};"
	>
		<div
			class="absolute left--6px top-50% translate-y--50% w-0 h-0 border-t-6 border-b-6 border-r-6 border-transparent border-r-background-80"
		></div>
		{sidebar.hovered}
	</div>
{/if}

<style>
	.indicator-from-top::before {
		animation: indicator-to-top 100ms ease-in-out forwards;
	}

	.indicator-from-top[data-current="true"]::before {
		animation: indicator-from-top 100ms ease-in-out forwards;
		animation-delay: 100ms;
	}

	.indicator-from-bottom::before {
		animation: indicator-to-bottom 100ms ease-in-out forwards;
	}

	.indicator-from-bottom[data-current="true"]::before {
		animation: indicator-from-bottom 100ms ease-in-out forwards;
		animation-delay: 100ms;
	}

	@keyframes indicator-from-top {
		from {
			height: 0;
			top: 0;
			transform: translateY(0%);
		}
		to {
			height: 18px;
			top: 0;
			transform: translateY(50%);
		}
	}

	@keyframes indicator-from-bottom {
		from {
			height: 0;
			bottom: 0;
			transform: translateY(0%);
		}
		to {
			height: 18px;
			bottom: 0;
			transform: translateY(-50%);
		}
	}

	@keyframes indicator-to-top {
		from {
			height: 18px;
			top: 0;
			transform: translateY(50%);
		}
		to {
			height: 0;
			top: 0;
			transform: translateY(0%);
		}
	}

	@keyframes indicator-to-bottom {
		from {
			height: 18px;
			bottom: 0;
			transform: translateY(-50%);
		}
		to {
			height: 0;
			bottom: 0;
			transform: translateY(0%);
		}
	}
</style>
