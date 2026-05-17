import { onMount } from 'svelte';
import { beforeNavigate, goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { get } from 'svelte/store';
import { page } from '$app/state';
import { pageTransition } from './transitionStore';

/**
 * Layout が参照するフラグを保持するオブジェクト。
 * ページが自前で goto() を呼んだ 2 回目のナビゲーションであることを示す。
 * Layout は skip が true の間、pageIn/pageOut を duration:0 にする。
 *
 * オブジェクト経由で共有することで、import 先からも書き換えが可能。
 */
export const layoutAnimFlags = { skip: false };

/**
 * 各ページのカスタムアニメーションを統一的に管理するコンポーザブル。
 * 従来の「$effect + skipAnimationOnce + beforeNavigate cancel」パターンを置き換える。
 *
 * 使い方:
 *   usePageAnimation({
 *     animateIn(from) { ... },   // 入場アニメーション（onMount 後に実行）
 *     animateOut(to, done) { ... } // 退場アニメーション（必ず done() を呼ぶこと）
 *   });
 *
 * 仕組み:
 *   1. ユーザーがナビゲーションをトリガー
 *   2. beforeNavigate で cancel() → pageTransition.set() → animateOut() を実行
 *   3. アニメーション完了後に done() → skipLayoutAnimation = true → goto()
 *   4. Layout の beforeNavigate が skipLayoutAnimation を検知して pageIn/pageOut を無効化
 *   5. 新ページの onMount で animateIn() を実行
 */
export function usePageAnimation(handlers: {
	animateIn?: (from: string) => void;
	animateOut?: (to: string, done: () => void) => void;
}) {
	/** アニメーション実行中フラグ（追加ナビゲーションをブロック） */
	let isAnimating = false;
	/**
	 * 自前 goto() による 2 回目の beforeNavigate をスキップするフラグ。
	 * skipLayoutAnimation はレイアウト用、skipNext はこのコンポーザブル自身用。
	 */
	let skipNext = false;

	onMount(() => {
		const tr = get(pageTransition);
		if (tr?.from) {
			handlers.animateIn?.(tr.from);
		}
	});

	beforeNavigate(({ cancel, to }) => {
		if (!to || !handlers.animateOut) return;

		// 自前 goto() による 2 回目のナビゲーション → 通過させる
		if (skipNext) {
			skipNext = false;
			isAnimating = false;
			return;
		}

		// アニメーション中の追加ナビゲーションはブロック
		if (isAnimating) {
			cancel();
			return;
		}

		const fromPath = page.url.pathname;
		const destPath = to.url.pathname;

		cancel();
		pageTransition.set({ from: fromPath, to: destPath });
		isAnimating = true;

		handlers.animateOut(destPath, () => {
			skipNext = true;
			layoutAnimFlags.skip = true;
			// destPath は beforeNavigate の to.url.pathname なので必ず有効なルート。
			// resolve() の型引数は SvelteKit が生成する union 型のため、
			// Parameters<typeof resolve> が never になる制限を as any で回避する。
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			goto(resolve(destPath as any));
		});
	});
}
