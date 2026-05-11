import crypto from 'node:crypto';

type PendingStatus = 'waiting' | 'authenticated' | 'expired';

interface PendingSession {
	sessionId?: string;
	status: PendingStatus;
	expiresAt: number;
}

const EXPIRY_MS = 30 * 60 * 1000;

const pending = new Map<string, PendingSession>();

export function createPending(id: string): void {
	pending.set(id, {
		status: 'waiting',
		expiresAt: Date.now() + EXPIRY_MS
	});
}

export function getPending(id: string): PendingSession | undefined {
	const entry = pending.get(id);
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) {
		entry.status = 'expired';
	}
	return entry;
}

export function completePending(id: string, sessionId: string): boolean {
	const entry = pending.get(id);
	if (!entry || Date.now() > entry.expiresAt) return false;
	entry.status = 'authenticated';
	entry.sessionId = sessionId;
	return true;
}

export function createPendingId(): string {
	return crypto.randomBytes(16).toString('hex');
}
