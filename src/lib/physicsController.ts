/**
 * Physics Controller — external input API
 *
 * 物理デバイスや UI ノブから回転量・クリックを受け取り、
 * 各ページに配信するための単一エントリポイント。
 *
 * 外部ソースからのイベント注入:
 *   pushRotation(deltaDegrees)  — 回転量を積算
 *   pushClick()                 — クリックイベントを発火
 *
 * ページはストアを subscribe して使う:
 *   physicsRotation     — 累積回転角 (度)
 *   physicsClickCount   — クリック累積回数 (増加を検知して使う)
 *   modeSwitchEnabled   — ノブでページ切替を行うか否か (ボタンで toggle)
 */

import { writable } from 'svelte/store';

/** 累積回転角 (度)。正 = 時計回り、負 = 反時計回り */
export const physicsRotation = writable<number>(0);

/**
 * クリックカウンター。
 * クリックごとに +1 される。ページは「前回と値が変わった」ことを検知して使う。
 */
export const physicsClickCount = writable<number>(0);

/**
 * ノブでページナビゲーション(モード切替)を行うか否か。
 * true  → ノブ回転でページ切替
 * false → 各ページ固有のノブ動作
 */
export const modeSwitchEnabled = writable<boolean>(true);

// ---- External API ----

/**
 * 任意のソース(UI ノブ・物理デバイス等)から回転量を注入する。
 * @param deltaDegrees 差分角度 (度)。正 = 時計回り
 */
export function pushRotation(deltaDegrees: number): void {
	physicsRotation.update((r) => r + deltaDegrees);
}

/**
 * 任意のソースからクリックイベントを注入する。
 */
export function pushClick(): void {
	physicsClickCount.update((n) => n + 1);
}

/**
 * ボタンの ON/OFF を切り替える。
 * UI ボタンまたは物理ボタンから呼ぶ。
 */
export function toggleModeSwitch(): void {
	modeSwitchEnabled.update((v) => !v);
}

/**
 * 累積回転をリセットする。
 * ページ遷移後など、基準をリセットしたい場合に使う。
 */
export function resetRotation(): void {
	physicsRotation.set(0);
}
