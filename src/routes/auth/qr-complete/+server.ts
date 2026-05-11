import { redirect, error } from '@sveltejs/kit';
import { getPending } from '$lib/server/pendingAuth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const id = url.searchParams.get('id');
	if (!id) error(400, 'Missing id');

	const entry = getPending(id);
	if (!entry || entry.status !== 'authenticated' || !entry.sessionId) {
		redirect(302, '/settings');
	}

	cookies.set('stacks_session', entry.sessionId, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 365
	});

	redirect(302, '/');
};
