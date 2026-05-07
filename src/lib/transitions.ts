import gsap from 'gsap';

export interface TransitionParams {
	x?: number;
	y?: number;
	opacity?: number; // in: 開始 opacity（デフォルト 1 = フェードなし）/ out: 終了 opacity
	duration?: number;
	ease?: string;
}

/**
 * ページイン用カスタムトランジション（GSAP イージング使用）
 * 要素が (x, y, opacity) から (0, 0, 1) へ移動
 */
export function pageIn(
	_node: Element,
	{ x = 0, y = 0, opacity = 1, duration = 400, ease = 'power3.out' }: TransitionParams = {}
) {
	const easeFunc = gsap.parseEase(ease)!;
	return {
		duration,
		css: (t: number) => {
			const et = easeFunc(t);
			const tx = x * (1 - et);
			const ty = y * (1 - et);
			// opacity: 開始値 opacity → 1
			const op = opacity + (1 - opacity) * et;
			return `opacity:${op};transform:translate(${tx}px,${ty}px)`;
		}
	};
}

/**
 * ページアウト用カスタムトランジション（GSAP イージング使用）
 * 要素が (0, 0, 1) から (x, y, opacity) へ移動
 */
export function pageOut(
	_node: Element,
	{ x = 0, y = 0, opacity = 1, duration = 400, ease = 'power3.in' }: TransitionParams = {}
) {
	const easeFunc = gsap.parseEase(ease)!;
	return {
		duration,
		css: (t: number) => {
			const progress = 1 - t; // out では t が 1→0 になるので反転
			const et = easeFunc(progress);
			const tx = x * et;
			const ty = y * et;
			// opacity: 1 → 終了値 opacity
			const op = 1 - (1 - opacity) * et;
			return `opacity:${op};transform:translate(${tx}px,${ty}px)`;
		}
	};
}
