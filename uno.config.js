import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetTypography,
	presetUno,
	transformerDirectives,
	transformerVariantGroup,
	presetWebFonts,
} from "unocss";

export default defineConfig({
	shortcuts: [
		{
			"sidebar-open": "w-240px px-2 lg:w-240px",
			"sidebar-close": "w-48px px-2 lg:w-48px",
			btn: "rounded-2 px-4 py-3 text-sm whitespace-nowrap transition-border-color duration-200 cursor-pointer bg-#141414 font-500 hover:bg-background-70 active:bg-background-70",
		},
	],
	rules: [],
	theme: {
		colors: {
			background: {
				DEFAULT: "var(--color-background-100)",
				90: "var(--color-background-90)",
				80: "var(--color-background-80)",
				70: "var(--color-background-70)",
			},
			content: {
				DEFAULT: "var(--color-content)",
			},
		},
	},
	layers: {
		default: 1,
		utilities: 2,
	},
	presets: [
		presetUno(),
		presetAttributify(),
		presetIcons(),
		presetTypography(),
		presetWebFonts({
			provider: "google",
			fonts: {
			},
		}),
	],
	transformers: [transformerDirectives(), transformerVariantGroup()],
});
