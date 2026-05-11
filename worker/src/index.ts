export interface Env {
	AUTH_KV: KVNamespace;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	WORKER_BASE_URL: string; // e.g. https://stacks-auth.xxx.workers.dev
	WORKER_SECRET: string;   // shared secret with SvelteKit server
}

interface SessionData {
	status: 'waiting' | 'done';
	accessToken?: string;
	refreshToken?: string;
	expiresIn?: number;
}

interface TokenResponse {
	access_token?: string;
	refresh_token?: string;
	expires_in?: number;
	error?: string;
}

// KV write: セッション作成 1 + レートカウンタ 1 + トークン保存 1 = 1ログインあたり最大 3 write
// 無料枠 1,000 write/日 → 300 セッション/日で制限してバッファを確保
const DAILY_SESSION_LIMIT = 300;
const SESSION_TTL = 30 * 60; // 30 分

function randomHex(bytes: number): string {
	const arr = new Uint8Array(bytes);
	crypto.getRandomValues(arr);
	return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function todayKey(): string {
	return `rl:${new Date().toISOString().slice(0, 10)}`;
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/session') return handleSession(request, env);
		if (url.pathname === '/connect') return handleConnect(request, env, url);
		if (url.pathname === '/callback') return handleCallback(request, env, url);
		if (url.pathname === '/poll') return handlePoll(request, env, url);

		return new Response('Not found', { status: 404 });
	}
};

// POST /session — SvelteKit サーバーからのみ呼ばれる（WORKER_SECRET で認証）
async function handleSession(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

	const auth = request.headers.get('Authorization');
	if (auth !== `Bearer ${env.WORKER_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	// レートリミット確認
	const rlKey = todayKey();
	const countStr = await env.AUTH_KV.get(rlKey);
	const count = countStr ? parseInt(countStr, 10) : 0;
	if (count >= DAILY_SESSION_LIMIT) {
		return json({ error: 'rate_limited', limit: DAILY_SESSION_LIMIT }, 429);
	}
	await env.AUTH_KV.put(rlKey, String(count + 1), { expirationTtl: 48 * 3600 });

	const pendingId = randomHex(16);
	const sessionData: SessionData = { status: 'waiting' };
	await env.AUTH_KV.put(`session:${pendingId}`, JSON.stringify(sessionData), {
		expirationTtl: SESSION_TTL
	});

	const connectUrl = `${env.WORKER_BASE_URL}/connect?id=${pendingId}`;
	return json({ pendingId, connectUrl });
}

// GET /connect?id=... — スマホのブラウザが開く → Google OAuth へリダイレクト
async function handleConnect(_request: Request, env: Env, url: URL): Promise<Response> {
	const id = url.searchParams.get('id');
	if (!id) return new Response('Missing id', { status: 400 });

	const entry = await env.AUTH_KV.get(`session:${id}`);
	if (!entry) {
		return new Response('このリンクは期限切れです。デバイスで QR を再生成してください。', {
			status: 410,
			headers: { 'Content-Type': 'text/plain; charset=utf-8' }
		});
	}

	const params = new URLSearchParams({
		client_id: env.GOOGLE_CLIENT_ID,
		redirect_uri: `${env.WORKER_BASE_URL}/callback`,
		response_type: 'code',
		scope: 'https://www.googleapis.com/auth/tasks',
		access_type: 'offline',
		prompt: 'consent',
		state: id
	});

	return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
}

// GET /callback?code=...&state=... — Google からのリダイレクト先
async function handleCallback(_request: Request, env: Env, url: URL): Promise<Response> {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state'); // = pendingId

	if (!code || !state) return new Response('Bad request', { status: 400 });

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: env.GOOGLE_CLIENT_ID,
			client_secret: env.GOOGLE_CLIENT_SECRET,
			redirect_uri: `${env.WORKER_BASE_URL}/callback`,
			grant_type: 'authorization_code'
		})
	});

	const data = (await res.json()) as TokenResponse;
	if (!res.ok || data.error || !data.access_token || !data.refresh_token) {
		return new Response('認証に失敗しました。もう一度お試しください。', {
			status: 502,
			headers: { 'Content-Type': 'text/plain; charset=utf-8' }
		});
	}

	const sessionData: SessionData = {
		status: 'done',
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in
	};
	await env.AUTH_KV.put(`session:${state}`, JSON.stringify(sessionData), {
		expirationTtl: SESSION_TTL
	});

	return new Response(
		`<!DOCTYPE html><html><head><meta charset="utf-8"><title>認証完了</title></head>` +
		`<body style="background:#111;color:#eee;font-family:sans-serif;display:flex;align-items:center;` +
		`justify-content:center;height:100vh;margin:0;text-align:center;">` +
		`<div><p style="font-size:2.5rem;margin:0">✅</p>` +
		`<p style="font-size:1.1rem;margin-top:16px;line-height:1.6">認証が完了しました。<br>デバイスに戻ってください。</p></div>` +
		`</body></html>`,
		{ headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}

// GET /poll?id=... — SvelteKit サーバーから定期的に呼ばれる
async function handlePoll(_request: Request, env: Env, url: URL): Promise<Response> {
	const id = url.searchParams.get('id');
	if (!id) return new Response('Missing id', { status: 400 });

	const entry = await env.AUTH_KV.get(`session:${id}`);
	if (!entry) return json({ status: 'expired' });

	const session = JSON.parse(entry) as SessionData;
	if (session.status !== 'done') return json({ status: 'waiting' });

	// トークンは一度だけ取得可能（セキュリティ上 KV から削除）
	await env.AUTH_KV.delete(`session:${id}`);
	return json({
		status: 'authenticated',
		accessToken: session.accessToken,
		refreshToken: session.refreshToken,
		expiresIn: session.expiresIn
	});
}
