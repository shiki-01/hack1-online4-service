/**
 * Google Tasks 連携ストア
 *
 * 認証済みの場合: /api/tasks から取得して localTasks を上書きする。
 * 未認証の場合: localTasks をそのまま使う。
 *
 * UI 側は completeTask / removeTask を呼ぶだけでよく、
 * ローカルと Google Tasks の両方が自動的に更新される。
 */

import { writable, get } from 'svelte/store';
import { localTasks, completeLocalTask, removeLocalTask } from './localTasks';
import type { LocalTask } from './localTasks';

export const isAuthenticated = writable(false);

const POLL_INTERVAL_MS = 30_000; // 30秒ごとに同期
let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * レイアウト起動時に呼ぶ。
 * authed=true なら Google Tasks を取得して localTasks に反映し、
 * 30秒ごとのポーリングを開始する。
 */
export async function initGoogleTasks(authed: boolean): Promise<void> {
	isAuthenticated.set(authed);
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
	if (!authed) return;
	await syncGoogleTasks();
	pollTimer = setInterval(syncGoogleTasks, POLL_INTERVAL_MS);
}

/**
 * Google Tasks API からタスクを取得して localTasks を更新する。
 */
export async function syncGoogleTasks(): Promise<void> {
	try {
		const res = await fetch('/api/tasks');
		if (!res.ok) return;
		const tasks: LocalTask[] = await res.json();
		// Date 文字列を Date オブジェクトに変換して localTasks に反映
		localTasks.set(
			tasks.map((t) => ({
				...t,
				dueDate: t.dueDate ? new Date(t.dueDate) : null,
				createdAt: new Date(t.createdAt),
				updatedAt: new Date(t.updatedAt)
			}))
		);
	} catch {
		// オフラインやエラー時はローカルキャッシュで継続
	}
}

/**
 * タスクを完了にする。
 * 認証済みなら Google Tasks API にも反映する。
 */
export async function completeTask(id: string): Promise<void> {
	if (get(isAuthenticated)) {
		await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' }
		}).catch(() => {});
	}
	completeLocalTask(id);
}

/**
 * タスクを削除する。
 * 認証済みなら Google Tasks API にも反映する。
 */
export async function removeTask(id: string): Promise<void> {
	if (get(isAuthenticated)) {
		await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
			method: 'DELETE'
		}).catch(() => {});
	}
	removeLocalTask(id);
}
