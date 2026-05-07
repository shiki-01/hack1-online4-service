import gsap from 'gsap';

export interface TransitionParams {
	x?: number;
	y?: number;
	opacity?: number;
	scale?: number; // in: 開始スケール（1 = 変化なし）/ out: 終了スケール
	duration?: number;
	ease?: string;
}

/**
 * ページイン用カスタムトランジション（GSAP イージング使用）
 * 要素が (x, y, opacity, scale) から (0, 0, 1, 1) へ移動
 */
export function pageIn(
	_node: Element,
	{ x = 0, y = 0, opacity = 1, scale = 1, duration = 400, ease = 'power3.out' }: TransitionParams = {}
) {
	const easeFunc = gsap.parseEase(ease)!;
	return {
		duration,
		css: (t: number) => {
			const et = easeFunc(t);
			const tx = x * (1 - et);
			const ty = y * (1 - et);
			const op = opacity + (1 - opacity) * et;
			const sc = scale + (1 - scale) * et; // scale → 1
			return `opacity:${op};transform:translate(${tx}px,${ty}px) scale(${sc})`;
		}
	};
}

/**
 * ページアウト用カスタムトランジション（GSAP イージング使用）
 * 要素が (0, 0, 1, 1) から (x, y, opacity, scale) へ移動
 */
export function pageOut(
	_node: Element,
	{ x = 0, y = 0, opacity = 1, scale = 1, duration = 400, ease = 'power3.in' }: TransitionParams = {}
) {
	const easeFunc = gsap.parseEase(ease)!;
	return {
		duration,
		css: (t: number) => {
			const progress = 1 - t; // out では t が 1→0 になるので反転
			const et = easeFunc(progress);
			const tx = x * et;
			const ty = y * et;
			const op = 1 - (1 - opacity) * et;
			const sc = 1 - (1 - scale) * et; // 1 → scale
			return `opacity:${op};transform:translate(${tx}px,${ty}px) scale(${sc})`;
		}
	};
}
