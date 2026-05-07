<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import gsap from 'gsap';
	import { goto } from '$app/navigation';
	import { pageTransition, skipAnimationOnce } from '$lib/transitionStore';
	import { EASE_OUT, EASE_IN } from '$lib/easings';
	import { resolve } from '$app/paths';

	let pageEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.document.body.className = 'bg:background';
		}
		// /table → /settings エントリーアニメーション
		const t = get(pageTransition);
		if (t?.from === '/table' && pageEl) {
			gsap.from(pageEl, { scale: 0.94, opacity: 0, duration: 0.35, ease: EASE_OUT });
		}
	});

	/** /settings → /table 退場アニメーション */
	$effect(() => {
		const t = $pageTransition;
		if (!t || t.from !== '/settings' || t.to !== '/table') return;
		if (!pageEl) return;

		gsap.to(pageEl, {
			scale: 0.94,
			opacity: 0,
			duration: 0.28,
			ease: EASE_IN,
			onComplete: () => {
				skipAnimationOnce.set(true);
				goto(resolve('/table'));
			}
		});
		return () => { if (pageEl) gsap.killTweensOf(pageEl); };
	});
</script>

<div class="rel w:full h:full r:full flex ai:center jc:center bg:base-5 overflow:hidden" aria-label="settings" bind:this={pageEl}>
	<span class="f:2rem font-weight:600 fg:base-2">設定</span>
</div>
