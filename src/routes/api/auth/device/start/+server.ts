import { STACKS_WORKER_URL, STACKS_WORKER_SECRET } from '$env/static/private';
import { json, error } from '@sveltejs/kit';
import { createPending } from '$lib/server/pendingAuth';
import type { RequestHandler } from '@sveltejs/kit';

interface WorkerSessionResponse {
	pendingId: string;
	connectUrl: string;
	error?: string;
}

export const GET: RequestHandler = async () => {
	const res = await fetch(`${STACKS_WORKER_URL}/session`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${STACKS_WORKER_SECRET}` }
	});

	if (!res.ok) {
		const body = await res.text();
		console.error('[device/start] Worker error:', res.status, body);
		const msg = res.status === 429
			? '本日のログイン上限に達しました。明日お試しください。'
			: 'Worker との通信に失敗しました。';
		error(res.status === 429 ? 429 : 502, msg);
	}

	const data: WorkerSessionResponse = await res.json();
	if (data.error) error(502, data.error);

	createPending(data.pendingId);

	return json({
		pendingId: data.pendingId,
		connectUrl: data.connectUrl,
		interval: 3
	});
};
