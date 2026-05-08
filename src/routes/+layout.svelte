<script lang="ts">
	import '@master/normal.css';
	import '../app.css';
	import { pageIn, pageOut, type TransitionParams } from '$lib/transitions';
	import { pageTransition, skipAnimationOnce } from '$lib/transitionStore';
	import { EASE_OUT, EASE_IN, EASE_STANDARD } from '$lib/easings';
	import { page } from '$app/state';
	import { goto, beforeNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		physicsRotation,
		modeSwitchEnabled,
		pushRotation,
		pushClick
	} from '$lib/physicsController';
	import PhysicsControls from '$lib/components/PhysicsControls.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { untrack } from 'svelte';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	const IS_PHYSICS = import.meta.env.VITE_IS_PHYSICS === 'true';
	const CURSOR_VISIBLE = import.meta.env.VITE_CURSOR_VISIBLE === 'true';
	const VERSION = '1.4.0';

	const DEGREES_PER_PAGE = 72;

	let { children } = $props();

	let navOpen = $state(false);
	let mainEl: HTMLElement | undefined = $state();
	let modeSwitchBaseRotation = 0;
	let modeSwitchBasePageIndex = 0;
	let pointerStartX = 0;
	let pointerStartY = 0;

	// 遷移アニメーションパラメータ（ページごとに異なる値を設定可能）
	let inParams = $state<TransitionParams>({ x: 560, duration: 380, ease: 'power3.out' });
	let outParams = $state<TransitionParams>({ x: -560, duration: 380, ease: 'power3.in' });

	onMount(() => {
		if (!IS_PHYSICS) return;

		const es = new EventSource('/api/rotation');

		es.addEventListener('rotation', (e) => {
			const { delta } = JSON.parse(e.data) as { delta: number };
			pushRotation(delta);
		});

		es.addEventListener('click', () => {
			pushClick();
		});

		return () => es.close();
	});

	// 水平スライドで移動するページ群
	const modes = [
		{ href: '/clock' },
		{ href: '/pomodoro' },
		{ href: '/stack' },
		{ href: '/settings' }
	] as const;

	// 垂直スワイプ（下から上）で開くページ群
	const verticalRoutes = ['/table'] as const;

	// ─── ルートごとのアニメーション設定 ────────────────────────────────────
	type AnimFn = (axis: 'x' | 'y', dir: 1 | -1) => TransitionParams;
	type RouteAnim = { in: AnimFn; out: AnimFn };

	// サブページなど未定義ルートのフォールバック
	const defaultAnim: RouteAnim = {
		in: (axis, dir) => ({
			x: axis === 'x' ? dir * 560 : 0,
			y: axis === 'y' ? dir * 560 : 0,
			duration: 380,
			ease: 'power3.out'
		}),
		out: (axis, dir) => ({
			x: axis === 'x' ? -dir * 560 : 0,
			y: axis === 'y' ? -dir * 560 : 0,
			duration: 320,
			ease: 'power3.in'
		})
	};

	const routeAnimations: Partial<Record<string, RouteAnim>> = {
		'/pomodoro': {
			in: (axis, dir) => ({
				x: axis === 'x' ? dir * 560 : 0,
				y: axis === 'y' ? dir * 560 : 0,
				duration: 400,
				ease: EASE_OUT
			}),
			out: (axis, dir) => ({
				x: axis === 'x' ? -dir * 560 : 0,
				y: axis === 'y' ? -dir * 560 : 0,
				duration: 300,
				ease: EASE_IN
			})
		},
		'/clock': {
			in: (axis, dir) => ({
				x: axis === 'x' ? dir * 560 : 0,
				y: axis === 'y' ? dir * 560 : 0,
				duration: 380,
				ease: EASE_OUT
			}),
			out: (axis, dir) => ({
				x: axis === 'x' ? -dir * 560 : 0,
				y: axis === 'y' ? -dir * 560 : 0,
				duration: 300,
				ease: EASE_IN
			})
		},
		'/stack': {
			in: (axis, dir) => ({
				x: axis === 'x' ? dir * 560 : 0,
				y: axis === 'y' ? dir * 560 : 0,
				duration: 450,
				ease: EASE_STANDARD
			}),
			out: (axis, dir) => ({
				x: axis === 'x' ? -dir * 560 : 0,
				y: axis === 'y' ? -dir * 560 : 0,
				duration: 300,
				ease: EASE_IN
			})
		},
		'/settings': {
			in: (axis, dir) => ({
				x: axis === 'x' ? dir * 560 : 0,
				y: axis === 'y' ? dir * 560 : 0,
				duration: 380,
				ease: EASE_OUT
			}),
			out: (axis, dir) => ({
				x: axis === 'x' ? -dir * 560 : 0,
				y: axis === 'y' ? -dir * 560 : 0,
				duration: 300,
				ease: EASE_IN
			})
		},
		'/table': {
			in: (_axis, dir) => ({ y: dir * 720, duration: 450, ease: EASE_OUT }),
			out: (_axis, dir) => ({ y: dir * -720, duration: 380, ease: EASE_IN })
		}
	};
	// ─────────────────────────────────────────────────────────────────────────

	const currentIndex = $derived(
		modes.findIndex(
			(m) => page.url.pathname === m.href || page.url.pathname.startsWith(m.href + '/')
		)
	);

	const isMainPage = $derived(
		modes.some((m) => page.url.pathname === m.href) ||
			verticalRoutes.some((r) => page.url.pathname === r)
	);

	const showPhysicsControls = $derived(
		modes.some((m) => page.url.pathname === m.href || page.url.pathname.startsWith(m.href + '/')) ||
			verticalRoutes.some((r) => page.url.pathname === r || page.url.pathname.startsWith(r + '/'))
	);

	const isSubPage = $derived(showPhysicsControls && !isMainPage);

	$effect(() => {
		if (!isMainPage) navOpen = false;
	});

	// 各ページが独自にアニメーションを処理するペア（layout のデフォルトスライドをキャンセル）
	const customElementPairs = new Set([
		// ─ 垂直（table） ─
		'/clock->/table',    '/table->/clock',
		'/pomodoro->/table', '/table->/pomodoro',
		'/stack->/table',    '/table->/stack',
		'/settings->/table', '/table->/settings',
		// ─ 水平（各ページが制御） ─
		'/clock->/pomodoro', '/pomodoro->/clock',
		'/pomodoro->/stack', '/stack->/pomodoro',
		'/stack->/settings', '/settings->/stack',
		'/clock->/stack',    '/stack->/clock',
		'/pomodoro->/settings', '/settings->/pomodoro',
		'/clock->/settings', '/settings->/clock'
	]);

	const pairAnimations: Partial<Record<string, { in: TransitionParams; out: TransitionParams }>> = {};
	// ─────────────────────────────────────────────────────────────────────────

	beforeNavigate(({ to, cancel }) => {
		if (!to) return;
		const toPath = to.url.pathname;
		const fromPath = page.url.pathname;
		const pairKey = `${fromPath}->${toPath}`;
		console.log(pairKey)

		if (customElementPairs.has(pairKey)) {
			if (!get(skipAnimationOnce)) {
				cancel();
				pageTransition.set({ from: fromPath, to: toPath });
				return;
			}
			skipAnimationOnce.set(false);
			outParams = { x: 0, y: 0, duration: 30 };
			inParams = { x: 0, y: 0, duration: 30 };
			pageTransition.set({ from: fromPath, to: toPath });
			return;
		}

		// 通常遷移：遷移情報をストアにセット
		pageTransition.set({ from: fromPath, to: toPath });

		const isVerticalRoot = (p: string) => verticalRoutes.some((r) => p === r);
		const isVerticalChild = (p: string) =>
			!isVerticalRoot(p) && verticalRoutes.some((r) => p.startsWith(r + '/'));
		const isHorizontalRoot = (p: string) => modes.some((m) => p === m.href);
		const isHorizontalChild = (p: string) =>
			!isHorizontalRoot(p) && modes.some((m) => p.startsWith(m.href + '/'));

		// 遷移方向を決定
		let axis: 'x' | 'y';
		let dir: 1 | -1 = 1;

		if (isVerticalRoot(toPath) && !isVerticalRoot(fromPath) && !isVerticalChild(fromPath)) {
			axis = 'y';
			dir = 1;
		} else if (isVerticalRoot(fromPath) && !isVerticalRoot(toPath) && !isVerticalChild(toPath)) {
			axis = 'y';
			dir = -1;
		} else {
			axis = 'x';
			const toIsSub = isHorizontalChild(toPath) || isVerticalChild(toPath);
			const fromIsSub = isHorizontalChild(fromPath) || isVerticalChild(fromPath);

			if (!fromIsSub && toIsSub) {
				dir = 1;
			} else if (fromIsSub && !toIsSub) {
				dir = -1;
			} else {
				const fromIdx = modes.findIndex((m) => fromPath === m.href);
				const toIdx = modes.findIndex((m) => toPath === m.href);
				if (fromIdx !== -1 && toIdx !== -1) dir = toIdx > fromIdx ? 1 : -1;
			}
		}

		// ペア固有アニメーション -> なければルート別 -> なければデフォルト
		const pairAnim = pairAnimations[pairKey];
		if (pairAnim) {
			inParams = pairAnim.in;
			outParams = pairAnim.out;
		} else if (toPath === '/settings' || fromPath === '/settings') {
			inParams = { opacity: 0, duration: 300, ease: EASE_OUT };
			outParams = { opacity: 0, duration: 200, ease: EASE_IN };
		} else {
			const inAnim = routeAnimations[toPath] ?? defaultAnim;
			const outAnim = routeAnimations[fromPath] ?? defaultAnim;
			inParams = inAnim.in(axis, dir);
			outParams = outAnim.out(axis, dir);
		}
	});

	function onPointerDown(e: PointerEvent) {
		pointerStartX = e.clientX;
		pointerStartY = e.clientY;
	}

	function onPointerUp(e: PointerEvent) {
		const dx = pointerStartX - e.clientX;
		const dy = pointerStartY - e.clientY;
		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);

		// 垂直スワイプ
		if (absDy > absDx && absDy >= 40) {
			if (dy > 0 && !page.url.pathname.startsWith('/table') && !navOpen) {
				// 上スワイプ -> /table を開く
				goto(resolve('/table'));
			}
			return;
		}

		// 水平スワイプ（/table では無効）
		if (page.url.pathname.startsWith('/table')) return;
		if (absDx < 40) return;

		// 左端からの右スワイプでナビを開く
		const mainRect = mainEl?.getBoundingClientRect();
		const relX = mainRect ? pointerStartX - mainRect.left : pointerStartX;
		if (isMainPage && !navOpen && relX < 30 && dx < 0) {
			navOpen = true;
			return;
		}

		if (navOpen) return;

		const tabHref = modes[currentIndex]?.href;
		if (tabHref && page.url.pathname !== tabHref) {
			if (dx < 0) goto(resolve(tabHref));
			return;
		}

		const next = currentIndex + (dx > 0 ? 1 : -1);
		if (next >= 0 && next < modes.length) {
			goto(resolve(modes[next].href));
		}
	}

	$effect(() => {
		if (!IS_PHYSICS || !$modeSwitchEnabled) return;
		const idx = currentIndex;
		untrack(() => {
			modeSwitchBaseRotation = get(physicsRotation);
			modeSwitchBasePageIndex = idx >= 0 ? idx : 0;
		});
	});

	$effect(() => {
		if (!IS_PHYSICS || !$modeSwitchEnabled || !isMainPage) return;

		const rotation = $physicsRotation;
		const delta = rotation - modeSwitchBaseRotation;
		const steps = Math.round(delta / DEGREES_PER_PAGE);
		const N = modes.length;
		const newIndex = (((modeSwitchBasePageIndex + steps) % N) + N) % N;
		const curIdx = currentIndex >= 0 ? currentIndex : 0;

		if (newIndex !== curIdx) {
			goto(resolve(modes[newIndex].href));
		}
	});
</script>

<main
	class="w:720px h:720px r:full flex bg:base-6 ai:center jc:center flex-shrink:0"
	style="touch-action: none; cursor: {CURSOR_VISIBLE ? 'default' : 'none'} !important;"
	bind:this={mainEl}
	onpointerdown={onPointerDown}
	onpointerup={onPointerUp}
>
	<div class="fixed top:10px left:10px fg:white">{VERSION}</div>
	<div class="w:100% h:100% overflow:hidden r:full rel">
		{#key page.url.pathname}
			<div
				class="abs inset:0 flex ai:center jc:center"
				in:pageIn={inParams}
				out:pageOut={outParams}
			>
				{@render children?.()}
			</div>
		{/key}

		{#if isMainPage && navOpen}
			<div
				role="button"
				tabindex="0"
				class="abs inset:0 z:15"
				onpointerdown={(e) => {
					navOpen = false;
					e.stopPropagation();
				}}
				onpointerup={(e) => e.stopPropagation()}
			></div>
			<Nav />
		{/if}

		{#if IS_PHYSICS && showPhysicsControls}
			<PhysicsControls disableToggle={isSubPage} />
		{/if}
	</div>
</main>
