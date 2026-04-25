import { sveltekit } from '@sveltejs/kit/vite';
import masterCSS from '@master/css.vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
	const useHttps = mode === 'https';

	return {
		plugins: [sveltekit(), ...(useHttps ? [basicSsl()] : []), masterCSS()],
		server: {
			host: true,
			https: useHttps ? {} : undefined,
			fs: {
				allow: [
					'C:/Users/kishi/Documents/GitHub/hack1-online4-service',
					'..',
					'../..',
					'.claude',
					'./master.css.ts'
				]
			}
		}
	};
});
