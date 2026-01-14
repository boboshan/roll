/**
 * Site-wide configuration and metadata
 * Centralized location for SEO, branding, and app settings
 */

export const siteConfig = {
	name: 'Roll',
	tagline: 'Edit Videos in Your Browser',
	description:
		'Free browser-based video editing tools. Compress, convert, trim, and mute videos instantly. No uploads, no servers — all processing happens locally in your browser.',
	keywords: [
		'video editor',
		'video compressor',
		'video converter',
		'trim video',
		'mute video',
		'browser video editor',
		'ffmpeg',
		'wasm',
		'free video tools',
		'online video editor',
		'privacy-first'
	],
	author: 'bbs',
	version: '0.0.1',
	themeColor: '#ff6930'
} as const;

export const siteUrls = {
	// Use environment variable in production, fallback for dev
	base: import.meta.env.VITE_SITE_URL || 'https://roll.video',
	github: 'https://github.com/bbs/roll'
} as const;

export const socialConfig = {
	twitter: '@bbs',
	ogType: 'website',
	ogLocale: 'en_US'
} as const;
