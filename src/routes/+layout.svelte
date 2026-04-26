<script lang="ts">
	import '@master/normal.css';
	import '../app.css';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

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
</script>

<main
	class="w:720px h:720px bg:#4d4d4d r:full flex ai:center jc:center flex-shrink:0"
	style="touch-action: none"
	onpointerdown={onPointerDown}
	onpointerup={onPointerUp}
>
	<div class="w:100% h:100% bg:#161616 overflow:hidden r:full rel">
		{#key page.url.pathname}
			<div
				class="page-slide"
				in:fly={{ x: slideDir * 560, duration: 380, easing: cubicOut }}
				out:fly={{ x: -slideDir * 560, duration: 380, easing: cubicOut }}
			>
				{@render children?.()}
			</div>
		{/key}
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
