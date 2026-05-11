import { json, error } from '@sveltejs/kit';
import { getPending } from '$lib/server/pendingAuth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (!id) error(400, 'Missing id');

	const entry = getPending(id);
	if (!entry) error(404, 'Not found');

	return json({ status: entry.status });
};
