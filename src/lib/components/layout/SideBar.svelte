<script>
	import { navLinks } from "$lib/config";
	import SettingIcon from "$lib/icons/Setting.svelte";
	import Logo from "$lib/icons/Logo.svelte";
	// import MenuIcon from "$lib/icons/Menu.svelte";

	let { url } = $props();
	let sidebar = $state({
		open: false,
		hovered: "",
	});

	let innerWidth = $state();

	let currentIndex = 0;
	let previousIndex = 0;

	let activeLink = $derived.by(() => {
		const newIndex = navLinks.findIndex((link) => link.href === url);
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

	function typewriter(node, { speed = 1 }) {
		const valid =
			node.childNodes.length === 1 &&
			node.childNodes[0].nodeType === Node.TEXT_NODE;

		if (!valid) {
			throw new Error(
				`This transition only works on elements with a single text node child`
			);
		}

		const text = node.textContent;
		const duration = text.length / (speed * 0.01);

		return {
			duration,
			tick: (t) => {
				const i = ~~(text.length * t);
				node.textContent = text.slice(0, i);
			},
		};
	}
</script>

<svelte:window bind:innerWidth onresize={handleResize} />

<aside
	data-tauri-drag-region
	class="relative shrink-0 flex flex-col justify-between gap-1 h-full pb-1 px-1 select-none transition-all duration-300 ease-in-out"
	class:sidebar-open={sidebar.open}
	class:sidebar-close={!sidebar.open}
>
	<div class="inline-flex justify-start items-center mt-5 overflow-hidden">
		<button
			onclick={toggleMenu}
			class="shrink-0 inline-flex justify-center items-center vertical-top w-10 h-9 bg-inherit hover:scale-110 active:scale-90 transition-transform duration-200 ease-out"
		>
			<Logo width="20px" height="20px" />
		</button>
		{#if sidebar.open}
			<span
				class="text-sm font-bold vertical-top leading-6"
				in:typewriter={{ speed: 0.8 }}
				out:typewriter={{ speed: 1.5 }}
			>
				Roll
			</span>
			<span class="text-sm blink">_</span>
		{/if}
	</div>
	<nav class="flex flex-col gap-1">
		<!-- <button
			class="group flex justify-center items-center w-10 h-9 px-1 py-1.5 rounded-md bg-inherit hover:bg-background-70 active:bg-background-80 transition-colors transition-transform duration-100 text-center"
			onclick={toggleMenu}
		>
			<MenuIcon
				width="18px"
				height="18px"
				class="group-active:scale-x-40 transition-transform duration-100 ease-in-out"
			/>
		</button> -->
		{#each navLinks as { href, label, icon: Icon }, index}
			<a
				{href}
				onmouseenter={(e) => {
					sidebar.hovered = label;
					tooltipPosition = getTooltipPosition(e);
				}}
				onmouseleave={() => (sidebar.hovered = "")}
				data-current={activeLink.currentIndex === index}
				class="relative w-full whitespace-nowrap rounded-md transition-colors transition-transform duration-100 hover:bg-background-70 active:text-content-90 data-[current=true]:bg-background-70 data-[current=true]:hover:not-active:bg-background-80 active:before:bg-orange-7 before:(absolute content-empty left--0.5 w-1 rounded bg-orange-5)"
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
				<div class="w-full inline-flex items-center overflow-hidden">
					<span
						class="shrink-0 inline-flex justify-center items-center vertical-top w-10 h-9"
					>
						<Icon width="18px" height="18px" />
					</span>
					<span class="text-sm leading-6">
						{label}
					</span>
				</div>
			</a>
		{/each}
	</nav>
	<button
		class="mt-a flex justify-center items-center vertical-top w-10 h-9 px-1 py-1.5 rounded-md bg-inherit hover:bg-background-70 active:(bg-background-80 text-content-90) transition-colors transition-transform duration-100 text-center"
	>
		<SettingIcon width="18px" height="18px" />
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

	.blink {
		animation: blink 1s step-end infinite;
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

	@keyframes blink {
		from,
		to {
			color: transparent;
		}
		50% {
			color: var(--color-content-100);
		}
	}
</style>
