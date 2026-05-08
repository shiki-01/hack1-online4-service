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
		const t = get(pageTransition);
		if (!t || !pageEl) return;

		if (t.from === '/table') {
			// /table → /settings: スケール + フェード
			gsap.from(pageEl, { scale: 0.94, opacity: 0, duration: 0.35, ease: EASE_OUT });
		} else if (t.from === '/clock' || t.from === '/pomodoro' || t.from === '/stack') {
			// 水平遷移 → /settings: フェード
			gsap.from(pageEl, { opacity: 0, duration: 0.3, ease: EASE_OUT });
		}
	});

	/** /settings 退場アニメーション（どこへでもフェード） */
	$effect(() => {
		const t = $pageTransition;
		if (!t || t.from !== '/settings') return;
		if (t.to !== '/clock' && t.to !== '/pomodoro' && t.to !== '/settings' && t.to !== '/table') return;
		if (!pageEl) return;

		const dest = t.to;
		const isTable = dest === '/table';

		gsap.to(pageEl, {
			...(isTable ? { scale: 0.94 } : {}),
			opacity: 0,
			duration: isTable ? 0.28 : 0.2,
			ease: EASE_IN,
			onComplete: () => {
				skipAnimationOnce.set(true);
				goto(resolve(dest));
			}
		});
		return () => { if (pageEl) gsap.killTweensOf(pageEl); };
	});
</script>

<div class="rel w:full h:full r:full flex ai:center jc:center bg:base-5 overflow:hidden" aria-label="settings" bind:this={pageEl}>
	<span class="f:2rem font-weight:600 fg:base-2">設定</span>
</div>
