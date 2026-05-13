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

	// nmcli を非同期で起動し、レスポンスを先に返す。
	// WiFi 接続が成功すると AP が切れてスマホとの HTTP 接続が途切れるため、
	// await すると fetch が永遠にハングする。
	setTimeout(() => {
		nmcliConnect(ssid, password).catch(() => {/* OS ログに任せる */});
	}, 300);

	return json({ success: true });
};
