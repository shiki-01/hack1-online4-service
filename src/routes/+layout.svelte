<script lang="ts">
	import '@master/normal.css';
	import '../app.css';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { physicsRotation, modeSwitchEnabled } from '$lib/physicsController';
	import PhysicsControls from '$lib/components/PhysicsControls.svelte';
	import { untrack } from 'svelte';
	import { get } from 'svelte/store';

	const IS_PHYSICS = import.meta.env.VITE_IS_PHYSICS === 'true';
	const VERSION = '1.0.0';

	let { children } = $props();

	const modes = [
		{ href: '/clock' },
		{ href: '/stack' },
		{ href: '/table' }
	] as const;

	const currentIndex = $derived(
		modes.findIndex(
			(m) => page.url.pathname === m.href || page.url.pathname.startsWith(m.href + '/')
		)
	);

	/** メインページ(clock/stack/table)にいるか */
	const isMainPage = $derived(
		modes.some((m) => page.url.pathname === m.href)
	);

	/** Physics コントロールを表示すべきページ (clock/stack/table + table/[id]) */
	const showPhysicsControls = $derived(
		modes.some((m) => page.url.pathname === m.href || page.url.pathname.startsWith(m.href + '/'))
	);

	/** table/[id] など、サブページにいるか */
	const isSubPage = $derived(showPhysicsControls && !isMainPage);

	let slideDir = $state(1); // 1: 左スワイプ(次へ), -1: 右スワイプ(前へ)

	let pointerStartX = 0;
	let pointerStartY = 0;

	function onPointerDown(e: PointerEvent) {
		pointerStartX = e.clientX;
		pointerStartY = e.clientY;
	}

	function onPointerUp(e: PointerEvent) {
		const dx = pointerStartX - e.clientX;
		const dy = pointerStartY - e.clientY;

		if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 40) return;

		// サブページ(/table/[id] など)にいる場合は親ページに戻る
		const tabHref = modes[currentIndex]?.href;
		if (tabHref && page.url.pathname !== tabHref) {
			slideDir = -1;
			goto(resolve(tabHref));
			return;
		}

		const next = currentIndex + (dx > 0 ? 1 : -1);
		if (next >= 0 && next < modes.length) {
			slideDir = dx > 0 ? 1 : -1;
			goto(resolve(modes[next].href));
		}
	}

	// ---- Physics: knob でページ切替 (modeSwitchEnabled=true 時) ----
	/**
	 * 一周(360度) = 3ページ → 1ページあたり 120度
	 * ノブをちょうど一周すると clock→stack→table→clock と循環する
	 */
	const DEGREES_PER_PAGE = 120;

	// modeSwitchEnabled が true になった瞬間の回転値とページ index を記録
	// これにより、ページ固有モードから戻ったときに突然ジャンプしない
	let modeSwitchBaseRotation = 0;
	let modeSwitchBasePageIndex = 0;

	// modeSwitchEnabled が true になったタイミングを捕捉してベースラインを更新
	$effect(() => {
		if (!IS_PHYSICS || !$modeSwitchEnabled) return;
		untrack(() => {
			modeSwitchBaseRotation = get(physicsRotation);
			modeSwitchBasePageIndex = currentIndex >= 0 ? currentIndex : 0;
		});
	});

	// ノブ回転でページ切替
	$effect(() => {
		if (!IS_PHYSICS || !$modeSwitchEnabled || !isMainPage) return;

		const rotation = $physicsRotation;
		const delta = rotation - modeSwitchBaseRotation;
		const steps = Math.round(delta / DEGREES_PER_PAGE);
		const N = modes.length;
		const newIndex = ((modeSwitchBasePageIndex + steps) % N + N) % N;
		const curIdx = currentIndex >= 0 ? currentIndex : 0;

		if (newIndex !== curIdx) {
			slideDir = newIndex > curIdx ? 1 : -1;
			goto(resolve(modes[newIndex].href));
		}
	});
</script>

<main
	class="w:720px h:720px r:full flex ai:center jc:center flex-shrink:0"
	style="touch-action: none"
	onpointerdown={onPointerDown}
	onpointerup={onPointerUp}
>
	<div class="fixed top:10px left:10px fg:white">{VERSION}</div>
	<div class="w:100% h:100% overflow:hidden r:full rel">
		{#key page.url.pathname}
			<div
				class="page-slide"
				in:fly={{ x: slideDir * 560, duration: 380, easing: cubicOut }}
				out:fly={{ x: -slideDir * 560, duration: 380, easing: cubicOut }}
			>
				{@render children?.()}
			</div>
		{/key}

		{#if IS_PHYSICS && showPhysicsControls}
			<PhysicsControls disableToggle={isSubPage} />
		{/if}
	</div>
</main>

<style>
	.page-slide {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
