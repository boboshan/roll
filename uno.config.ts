import { defineConfig, presetWind4 } from 'unocss';

export default defineConfig({
	presets: [
		presetWind4({
			preflights: {
				reset: true
			},
			dark: 'class'
		})
	],
	theme: {
		colors: {
			// Primary - Brand orange from logo (#ff6930, #f04424, #d83d24)
			primary: {
				50: '#fff7ed',
				100: '#ffedd5',
				200: '#fed7aa',
				300: '#fdba74',
				400: '#fb923c',
				500: '#ff6930', // Main brand color
				600: '#f04424', // Secondary brand
				700: '#d83d24', // Dark brand
				800: '#9a3412',
				900: '#7c2d12',
				950: '#431407'
			},
			// Accent - Complementary teal for contrast
			accent: {
				50: '#ecfeff',
				100: '#cffafe',
				200: '#a5f3fc',
				300: '#67e8f9',
				400: '#22d3ee',
				500: '#06b6d4',
				600: '#0891b2',
				700: '#0e7490',
				800: '#155e75',
				900: '#164e63',
				950: '#083344'
			},
			// Surface colors for cards, backgrounds
			// Dark mode: slightly warmer and less contrast
			surface: {
				50: '#fafaf9',
				100: '#f5f5f4',
				200: '#e7e5e4',
				300: '#d6d3d1',
				400: '#a8a29e',
				500: '#78716c',
				600: '#57534e',
				700: '#44403c',
				800: '#302c29',
				900: '#211f1d',
				950: '#141211'
			}
		}
	},
	shortcuts: {
		// Surface utilities
		'bg-base': 'bg-white dark:bg-surface-950',
		'bg-elevated': 'bg-surface-50 dark:bg-surface-950',
		'bg-muted': 'bg-surface-100 dark:bg-surface-800',
		'border-base': 'border-surface-200 dark:border-surface-800',
		'border-subtle': 'border-surface-100 dark:border-surface-800/50',
		// Text utilities
		'text-base': 'text-surface-900 dark:text-surface-100',
		'text-muted': 'text-surface-500 dark:text-surface-400',
		'text-subtle': 'text-surface-400 dark:text-surface-500',
		// Interactive states
		'hover-bg': 'hover:bg-surface-100 dark:hover:bg-surface-800',
		'active-bg': 'bg-primary-50 dark:bg-primary-950',
		// Button variants
		'btn-primary':
			'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-98',
		'btn-accent':
			'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-98',
		'btn-ghost':
			'text-muted hover:text-base hover-bg px-4 py-2 rounded-xl transition-colors font-medium',
		// Card
		card: 'bg-base border border-base rounded-2xl shadow-sm',
		'card-elevated': 'bg-elevated border border-base rounded-2xl'
	}
});
