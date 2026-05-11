import { STACKS_WORKER_URL } from '$env/static/private';
import { json, error } from '@sveltejs/kit';
import { getPending, completePending } from '$lib/server/pendingAuth';
import { createSessionId, setSession } from '$lib/server/session';
import type { RequestHandler } from '@sveltejs/kit';

interface WorkerPollResponse {
	status: 'waiting' | 'authenticated' | 'expired';
	accessToken?: string;
	refreshToken?: string;
	expiresIn?: number;
}

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (!id) error(400, 'Missing id');

	const entry = getPending(id);
	if (!entry) error(404, 'Not found');
	if (entry.status === 'expired') return json({ status: 'expired' });
	if (entry.status === 'authenticated') return json({ status: 'authenticated' });

	const res = await fetch(`${STACKS_WORKER_URL}/poll?id=${id}`);
	if (!res.ok) return json({ status: 'waiting' });

	const data: WorkerPollResponse = await res.json();

	if (data.status === 'authenticated' && data.accessToken && data.refreshToken) {
		const sessionId = createSessionId();
		setSession(sessionId, {
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			expiresAt: Date.now() + (data.expiresIn ?? 3600) * 1000
		});
		completePending(id, sessionId);
	}

	return json({ status: data.status });
};
