import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { createPendingId, createPending } from '$lib/server/pendingAuth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const pendingId = createPendingId();
	createPending(pendingId);

	const params = new URLSearchParams({
		client_id: GOOGLE_CLIENT_ID,
		redirect_uri: GOOGLE_REDIRECT_URI,
		response_type: 'code',
		scope: 'https://www.googleapis.com/auth/tasks',
		access_type: 'offline',
		prompt: 'consent',
		state: pendingId
	});

	const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
	return json({ pendingId, oauthUrl });
};
