<script lang="ts">
	import 'virtual:uno.css';
	import favicon from '$lib/assets/favicon.svg';
	import ogImage from '$lib/assets/logo.svg';
	import { siteConfig, siteUrls, socialConfig } from '$lib/config';
	import { themeStore } from '$lib/state/theme.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	const title = `${siteConfig.name} — ${siteConfig.tagline}`;
	const keywords = siteConfig.keywords.join(', ');

	onMount(() => {
		themeStore.init();
	});
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{title}</title>
	<meta name="title" content={title} />
	<meta name="description" content={siteConfig.description} />
	<meta name="keywords" content={keywords} />
	<meta name="author" content={siteConfig.author} />
	<meta name="robots" content="index, follow" />
	<meta name="language" content="English" />

	<!-- Favicon -->
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={socialConfig.ogType} />
	<meta property="og:url" content={siteUrls.base} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={siteConfig.description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:locale" content={socialConfig.ogLocale} />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={siteUrls.base} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={siteConfig.description} />
	<meta name="twitter:image" content={ogImage} />

	<!-- PWA / Mobile -->
	<meta name="theme-color" content={siteConfig.themeColor} />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content={siteConfig.name} />

	<!-- Canonical -->
	<link rel="canonical" href={siteUrls.base} />
</svelte:head>

{@render children()}
