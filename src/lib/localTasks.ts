/**
 * ローカルタスクストア
 *
 * 単体で動作するローカル永続化実装。
 * 将来の Google Tasks API 移行を見据えた設計:
 *
 *   LocalTask.id          → Google Task.id
 *   LocalTask.title       → Google Task.title
 *   LocalTask.description → Google Task.notes
 *   LocalTask.dueDate     → Google Task.due (RFC 3339 date-only)
 *   LocalTask.status      → Google Task.status ('needsAction' | 'completed')
 *
 *   priority / category / subtasks は Google Tasks にない独自フィールド。
 *   これらはローカルキャッシュのみで管理する。
 */

import { writable, derived, get } from 'svelte/store';
import { t } from './i18n';
import type { Locale } from './languageStore';

export interface LocalTask {
	id: string;
	title: string;
	description: string;
	dueDate: Date | null;
	priority: 'low' | 'medium' | 'high';
	category: string;
	status: 'pending' | 'completed' | 'archived';
	subtasks: { text: string; checked: boolean }[];
	createdAt: Date;
	updatedAt: Date;
}

// ---- シリアライズ ----

type Serialized = Omit<LocalTask, 'dueDate' | 'createdAt' | 'updatedAt'> & {
	dueDate: string | null;
	createdAt: string;
	updatedAt: string;
};

function serialize(t: LocalTask): Serialized {
	return {
		...t,
		dueDate: t.dueDate?.toISOString() ?? null,
		createdAt: t.createdAt.toISOString(),
		updatedAt: t.updatedAt.toISOString()
	};
}

function deserialize(raw: Serialized): LocalTask {
	return {
		...raw,
		dueDate: raw.dueDate ? new Date(raw.dueDate) : null,
		createdAt: new Date(raw.createdAt),
		updatedAt: new Date(raw.updatedAt)
	};
}

// ---- デフォルトデータ ----

const STORAGE_KEY = 'stacks_tasks_v1';

function uid(): string {
	return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function addDays(n: number): Date {
	return new Date(Date.now() + n * 86_400_000);
}

function makeTask(
	title: string,
	description: string,
	dueDays: number | null,
	priority: LocalTask['priority'],
	category: string
): LocalTask {
	const now = new Date();
	return {
		id: uid(),
		title,
		description,
		dueDate: dueDays !== null ? addDays(dueDays) : null,
		priority,
		category,
		status: 'pending',
		subtasks: [],
		createdAt: now,
		updatedAt: now
	};
}

function defaultTasks(): LocalTask[] {
	return [
		makeTask(
			'映像アート論 課題提出',
			'課題提出は今週中なので必ず期限内に資料を提出する必要あり',
			3,
			'high',
			'大学'
		),
		makeTask('積みゲー消化', '', null, 'low', 'エンタメ'),
		makeTask('積みゲー消化', '', null, 'low', 'エンタメ'),
		makeTask('レポート提出', '経済学のレポート。3000字以上。', 0.3, 'high', '大学'),
		makeTask('洗濯', '', 1.5, 'medium', '家事'),
		makeTask('歯医者の予約', '', 5, 'medium', '健康'),
		makeTask('プログラミング課題', 'React のコンポーネント設計課題', 2, 'high', '大学'),
		makeTask('部屋の掃除', '', 0.5, 'low', '家事'),
		makeTask('本を返却', '図書館の返却期限', 8, 'low', 'その他'),
		makeTask('友人への返信', '', 0.8, 'medium', '連絡'),
		makeTask('Figma デザイン修正', 'プロトタイプのアニメーションを直す', 4, 'medium', '大学'),
		makeTask('ジョギング', '', null, 'low', '健康')
	];
}

// ---- ストレージ ----

function loadFromStorage(): LocalTask[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			const defaults = defaultTasks();
			saveToStorage(defaults);
			return defaults;
		}
		return (JSON.parse(raw) as Serialized[]).map(deserialize);
	} catch {
		return defaultTasks();
	}
}

function saveToStorage(tasks: LocalTask[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.map(serialize)));
}

// ---- Store ----

export const localTasks = writable<LocalTask[]>([]);

if (typeof window !== 'undefined') {
	localTasks.set(loadFromStorage());
	localTasks.subscribe(saveToStorage);
}

/** pending 状態のタスク一覧 */
export const pendingTasks = derived(localTasks, ($t) => $t.filter((t) => t.status === 'pending'));

// ---- ユーティリティ関数 ----

/**
 * タスク数に応じた色
 * < 5  : teal  (余裕)
 * < 10 : orange (要注意)
 * ≥ 10 : red   (やばい)
 */
export function countColor(n: number): string {
	if (n < 5) return '#4ECDC4';
	if (n < 10) return '#FF9E4A';
	return '#FF4444';
}

/**
 * 期限までの日数に応じた色
 * > 7日  : teal
 * ≤ 7日  : orange
 * ≤ 1日  : red
 */
export function deadlineColor(dueDate: Date | null): string {
	if (!dueDate) return '#4ECDC4';
	const d = (dueDate.getTime() - Date.now()) / 86_400_000;
	if (d < 1) return '#FF4444';
	if (d < 7) return '#FF9E4A';
	return '#4ECDC4';
}

/**
 * 期限が近いほど大きくなる球の半径
 * 期限なし: 24px
 * 14日超 : 24px
 * 14日以内: 30px
 * 7日以内 : 40px
 * 3日以内 : 50px
 * 1日以内 : 60px
 * 期限切れ : 68px
 */
export function bubbleRadius(dueDate: Date | null): number {
	if (!dueDate) return 24;
	const d = (dueDate.getTime() - Date.now()) / 86_400_000;
	if (d < 0) return 68;
	if (d < 1) return 60;
	if (d < 3) return 50;
	if (d < 7) return 40;
	if (d < 14) return 30;
	return 24;
}

/**
 * 期限までの残り日数を人間が読める文字列に変換する（ロケール対応）
 */
export function dueDateLabel(dueDate: Date | null, locale: Locale = 'ja'): string {
	const s = t(locale);
	if (!dueDate) return s.dueNone;
	const days = (dueDate.getTime() - Date.now()) / 86_400_000;
	if (days < 0) return s.overdue;
	if (days < 1) return s.today;
	if (days < 2) return s.tomorrow;
	return s.daysLater(Math.ceil(days));
}

// ---- アクション ----

export function addLocalTask(task: Omit<LocalTask, 'id' | 'createdAt' | 'updatedAt'>): string {
	const id = uid();
	const now = new Date();
	localTasks.update((list) => [{ ...task, id, createdAt: now, updatedAt: now }, ...list]);
	return id;
}

export function completeLocalTask(id: string) {
	const now = new Date();
	localTasks.update((list) =>
		list.map((t) => (t.id === id ? { ...t, status: 'completed' as const, updatedAt: now } : t))
	);
}

export function removeLocalTask(id: string) {
	localTasks.update((list) => list.filter((t) => t.id !== id));
}

export function getLocalTask(id: string): LocalTask | undefined {
	return get(localTasks).find((t) => t.id === id);
}
