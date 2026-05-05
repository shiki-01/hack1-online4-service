import type { Config } from '@master/css';

export default {
	styles: {},
	rules: {},
	variables: {
		// ── dark mode (default) ──────────────────────────────
		base_1: '#f7f7f7',   // primary text
		base_2: '#797979',   // muted text / inactive icons
		base_3: '#5c5c5c',   // tertiary text
		base_4: '#525252',   // deeper inactive
		base_5: '#2f2f2f',   // primary surface / background
		base_6: '#161616',   // deep background
		orange_1: '#e68938', // work phase / warm accent
		orange_2: '#de6e29',
		blue_1: '#50c2fb',   // break phase / cool accent
		blue_2: '#429fd8',
		red_1: '#df4242',    // danger / task count
		red_2: '#ef6053'
	},
	modes: {
		light: {
			base_1: '#161616',   // primary text → dark
			base_2: '#797979',   // muted text (same)
			base_3: '#8a8a8a',   // tertiary text
			base_4: '#a0a0a0',   // deeper inactive
			base_5: '#f0f0f0',   // primary surface → light
			base_6: '#ffffff',   // deep background → white
			orange_1: '#d4762a', // slightly darker for light bg contrast
			orange_2: '#b85f1e',
			blue_1: '#2a9fd8',   // slightly darker for light bg contrast
			blue_2: '#1a7daa',
			red_1: '#c93232',    // slightly darker for light bg contrast
			red_2: '#d44840'
		}
	},
	semantics: {},
	mediaQueries: {},
	animations: {},
	selectors: {},
	functions: {}
} as Config;
