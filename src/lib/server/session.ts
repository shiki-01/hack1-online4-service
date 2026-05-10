import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface Session {
	accessToken: string;
	refreshToken: string;
	expiresAt: number; // Unix ms
}

// Raspberry Pi 上では build/ と同階層に永続化する
// 開発時は .sessions.json をプロジェクトルートに作成
const SESSIONS_FILE = path.resolve(
	process.env.SESSIONS_FILE ?? path.join(process.cwd(), '.sessions.json')
);

type SessionStore = Record<string, Session>;

function load(): SessionStore {
	try {
		const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
		return JSON.parse(raw) as SessionStore;
	} catch {
		return {};
	}
}

function save(store: SessionStore): void {
	try {
		fs.writeFileSync(SESSIONS_FILE, JSON.stringify(store), 'utf-8');
	} catch (e) {
		console.error('[session] Failed to write sessions file:', e);
	}
}

// 起動時にファイルから読み込む
const sessions = new Map<string, Session>(Object.entries(load()));

export function createSessionId(): string {
	return crypto.randomBytes(32).toString('hex');
}

export function getSession(id: string): Session | undefined {
	return sessions.get(id);
}

export function setSession(id: string, session: Session): void {
	sessions.set(id, session);
	const store: SessionStore = {};
	sessions.forEach((v, k) => (store[k] = v));
	save(store);
}

export function deleteSession(id: string): void {
	sessions.delete(id);
	const store: SessionStore = {};
	sessions.forEach((v, k) => (store[k] = v));
	save(store);
}
