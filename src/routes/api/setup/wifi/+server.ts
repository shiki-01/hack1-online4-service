import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import type { RequestHandler } from './$types';

function nmcliConnect(ssid: string, password: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const args = ['dev', 'wifi', 'connect', ssid];
		if (password) args.push('password', password);
		args.push('ifname', 'wlan0');

		const proc = spawn('nmcli', args);
		let stderr = '';
		proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
		proc.on('close', (code: number | null) => {
			if (code === 0) resolve();
			else reject(new Error(stderr.trim() || `nmcli が終了コード ${code} で失敗しました`));
		});
		proc.on('error', reject);
	});
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json() as { ssid?: string; password?: string };
	const ssid = body.ssid?.trim() ?? '';
	const password = body.password ?? '';

	if (!ssid) {
		return json({ success: false, error: 'SSID を入力してください' }, { status: 400 });
	}

	try {
		await nmcliConnect(ssid, password);
		return json({ success: true });
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
};
