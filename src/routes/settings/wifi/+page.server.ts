import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		apSsid: process.env.WIFI_AP_SSID ?? 'STACKS-Setup',
		apPassword: process.env.WIFI_AP_PASSWORD ?? 'stacks1234'
	};
};
