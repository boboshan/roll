<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { video } from '$lib/state/video-manager.svelte';
	import { themeStore } from '$lib/state/theme.svelte';
	import Logo from '$lib/assets/logo.svg';
	import {
		Minimize2,
		ArrowLeftRight,
		Scissors,
		VolumeX,
		X,
		Sun,
		Moon,
		Monitor,
		AlertCircle,
		ChevronDown
	} from 'lucide-svelte';

	let { children } = $props();

	let sidebarOpen = $state(false);

	onMount(() => {
		video.init();
	});

	const currentToolId = $derived(page.url.pathname.split('/')[2]);

	// Tools configuration with lucide icon components
	const tools = [
		{
			id: 'compress',
			name: 'Compress',
			description: 'Reduce file size',
			icon: Minimize2
		},
		{
			id: 'convert',
			name: 'Convert',
			description: 'Change format',
			icon: ArrowLeftRight
		},
		{
			id: 'trim',
			name: 'Trim',
			description: 'Cut video length',
			icon: Scissors
		},
		{
			id: 'mute',
			name: 'Mute',
			description: 'Remove audio',
			icon: VolumeX
		}
	];

	function closeSidebar() {
		sidebarOpen = false;
	}

	// Theme icon component based on current theme
	const ThemeIcon = $derived(
		themeStore.theme === 'light' ? Sun : themeStore.theme === 'dark' ? Moon : Monitor
	);
</script>

<!-- Mobile overlay -->
{#if sidebarOpen}
	<div
		class="bg-black/50 inset-0 fixed z-40 backdrop-blur-sm lg:hidden"
		onclick={closeSidebar}
		onkeydown={(e) => e.key === 'Escape' && closeSidebar()}
		role="button"
		tabindex="0"
		aria-label="Close sidebar"
	></div>
{/if}

<div class="text-base font-sans bg-elevated flex h-screen overflow-hidden">
	<!-- Sidebar -->
	<aside
		class={[
			'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0',
			'bg-base border-r border-base flex flex-col shadow-xl lg:shadow-none',
			sidebarOpen ? 'translate-x-0' : '-translate-x-full'
		]}
	>
		<!-- Logo -->
		<div class="p-5 border-b border-base flex items-center justify-between">
			<a href="/tools/compress" class="group flex gap-3 items-center">
				<div class="flex-shrink-0 h-10 w-10">
					<img src={Logo} alt="Roll" class="h-full w-full" />
				</div>
				<div>
					<h1 class="text-lg tracking-tight font-bold">Roll</h1>
					<p class="text-xs text-muted">Edit videos in browser</p>
				</div>
			</a>
			<!-- Mobile close button -->
			<button
				class="bg-hover p-2 rounded-lg lg:hidden"
				onclick={closeSidebar}
				aria-label="Close menu"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Navigation -->
		<nav class="p-3 flex-1 overflow-y-auto">
			<p class="text-xs text-muted tracking-wider font-semibold mb-2 px-3 uppercase">Tools</p>
			<div class="space-y-1">
				{#each tools as tool (tool.id)}
					<a
						href="/tools/{tool.id}"
						onclick={closeSidebar}
						class={[
							'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
							currentToolId === tool.id
								? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
								: 'text-muted hover:text-base bg-hover'
						]}
					>
						<div
							class={[
								'rounded-lg p-2 transition-colors',
								currentToolId === tool.id
									? 'bg-primary-500/15 text-primary-600 dark:text-primary-400'
									: 'bg-surface-100 dark:bg-surface-800 text-surface-500'
							]}
						>
							<tool.icon class="h-4 w-4" />
						</div>
						<div class="flex-1 min-w-0">
							<span class="block truncate">{tool.name}</span>
							<span class="text-xs text-muted block truncate">{tool.description}</span>
						</div>
					</a>
				{/each}
			</div>
		</nav>

		<!-- Privacy Notice -->
		<div class="px-5 py-3 border-t border-base">
			<div class="bg-green-50 p-3 rounded-lg border border-green-200 dark:bg-green-950/30 dark:border-green-800/50">
				<div class="flex gap-2 items-start">
					<svg class="flex-shrink-0 h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<div>
						<p class="text-xs font-medium text-green-800 dark:text-green-300">100% Private</p>
						<p class="text-xs text-green-700 dark:text-green-400 mt-0.5">All processing happens locally in your browser. No uploads.</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="px-3 py-4 border-t border-base flex justify-end">
			<div class="p-0.5 rounded-lg bg-surface-100 flex dark:bg-surface-800">
				<button
					onclick={() => themeStore.setTheme('light')}
					class={[
						'p-1.5 rounded-md transition-all',
						themeStore.theme === 'light'
							? 'bg-base text-base shadow-sm'
							: 'text-muted hover:text-base'
					]}
					aria-label="Light theme"
				>
					<Sun class="h-4 w-4" />
				</button>
				<button
					onclick={() => themeStore.setTheme('dark')}
					class={[
						'p-1.5 rounded-md transition-all',
						themeStore.theme === 'dark'
							? 'bg-base text-base shadow-sm'
							: 'text-muted hover:text-base'
					]}
					aria-label="Dark theme"
				>
					<Moon class="h-4 w-4" />
				</button>
				<button
					onclick={() => themeStore.setTheme('system')}
					class={[
						'p-1.5 rounded-md transition-all',
						themeStore.theme === 'system'
							? 'bg-base text-base shadow-sm'
							: 'text-muted hover:text-base'
					]}
					aria-label="System theme"
				>
					<Monitor class="h-4 w-4" />
				</button>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="bg-surface-50 flex flex-1 flex-col relative overflow-hidden dark:bg-surface-900/50">
		<!-- Mobile Header -->
		<header class="px-4 py-3 border-b border-base bg-base flex items-center lg:hidden">
			<a href="/tools/compress" class="flex-shrink-0">
				<img src={Logo} alt="Roll" class="h-7 w-7" />
			</a>
			<button
				class="bg-hover px-2 py-1 rounded-lg flex gap-1 items-center -my-1"
				onclick={() => (sidebarOpen = true)}
				aria-label="Open menu"
			>
				<span class="font-semibold">
					{tools.find((t) => t.id === currentToolId)?.name || 'Tools'}
				</span>
				<ChevronDown class="mt-0.5 h-4 w-4" />
			</button>
			<div class="flex-1"></div>
			<button
				onclick={() => themeStore.toggle()}
				class="bg-hover p-2 rounded-lg -mr-2"
				aria-label="Toggle theme"
			>
				<ThemeIcon class="h-5 w-5" />
			</button>
		</header>

		<!-- Error Banner -->
		{#if video.error}
			<div
				class="text-red-700 p-4 border-b border-red-200 bg-red-50 flex items-center justify-between z-50 dark:text-red-300 dark:border-red-800/50 dark:bg-red-950/50"
			>
				<div class="flex gap-3 items-center">
					<AlertCircle class="flex-shrink-0 h-5 w-5" />
					<span>{video.error}</span>
				</div>
				<button
					onclick={() => (video.error = '')}
					class="p-1 rounded transition-colors hover:bg-red-100 dark:hover:bg-red-900/50"
					aria-label="Dismiss error"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		{/if}

		<!-- Scrollable Content Area -->
		<div class="p-4 flex-1 overflow-y-auto lg:p-8 md:p-6">
			<div class="mx-auto flex flex-col h-full max-w-6xl">
				{@render children()}
			</div>
		</div>
	</main>
</div>
