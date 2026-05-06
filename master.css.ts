import type { Config } from '@master/css';

export default {
	styles: {},
	rules: {},
	modeTrigger: 'class',
	defaultMode: 'dark',
	components: {
		'nav-btn': 'bg:transparent b:none cursor:pointer p:0 flex ai:center pointer-events:auto ~fill|200ms,stroke|200ms_svg_path,_svg_circle',
		'icon-wrap': 'w:90px square br:50% flex ai:center jc:center fg:#444 ~color|200ms ~background-color|200ms',
		'arrow-btn-base': 'bg:transparent b:none cursor:pointer flex ai:center jc:center opacity:.7 ~opacity|150ms',
		'arrow-btn': 'arrow-btn-base rotate(-90deg) p:6px|16px',
		'arrow-btn-sm': 'arrow-btn-base p:4px|10px',
	},
	variables: {
		'background': '#4D4D4D',
		'base-1': '#f7f7f7',
		'base-2': '#797979',
		'base-3': '#5c5c5c',
		'base-4': '#525252',
		'base-5': '#2f2f2f',
		'base-6': '#161616',
		'orange-1': '#e68938',
		'orange-2': '#de6e29',
		'blue-1': '#50c2fb',
		'blue-2': '#429fd8',
		'red-1': '#df4242',
		'red-2': '#ef6053',
		'font-family': {
			'reddit-sans': 'Reddit Sans'
		}
	},
	modes: {
		light: {
			'background': '#4D4D4D',
			'base-1': '#161616',
			'base-2': '#797979',
			'base-3': '#8a8a8a',
			'base-4': '#a0a0a0',
			'base-5': '#f0f0f0',
			'base-6': '#ffffff',
			'orange-1': '#d4762a',
			'orange-2': '#b85f1e',
			'blue-1': '#2a9fd8',
			'blue-2': '#1a7daa',
			'red-1': '#c93232',
			'red-2': '#d44840'
		}
	},
	semantics: {},
	mediaQueries: {},
	animations: {},
	selectors: {},
	functions: {}
} as Config;
