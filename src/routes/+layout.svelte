<script lang="ts">
	import '@master/normal.css';
	import '../app.css';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
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
	const VERSION = '1.2.0';

	const DEGREES_PER_PAGE = 72;

	let { children } = $props();

	let slideDir = $state(1);
	let modeSwitchBaseRotation = 0;
	let modeSwitchBasePageIndex = 0;
	let pointerStartX = 0;
	let pointerStartY = 0;

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

	const modes = [
		{ href: '/pomodoro' },
		{ href: '/clock' },
		{ href: '/stack' },
		{ href: '/table' },
		{ href: '/settings' }
	] as const;

	const currentIndex = $derived(
		modes.findIndex(
			(m) => page.url.pathname === m.href || page.url.pathname.startsWith(m.href + '/')
		)
	);

	const isMainPage = $derived(modes.some((m) => page.url.pathname === m.href));

	const showPhysicsControls = $derived(
		modes.some((m) => page.url.pathname === m.href || page.url.pathname.startsWith(m.href + '/'))
	);

	const isSubPage = $derived(showPhysicsControls && !isMainPage);

	beforeNavigate(({ to }) => {
		if (!to) return;
		const toPath = to.url.pathname;
		const fromPath = page.url.pathname;
		const toIsSub =
			!modes.some((m) => toPath === m.href) && modes.some((m) => toPath.startsWith(m.href + '/'));
		const fromIsSub =
			!modes.some((m) => fromPath === m.href) &&
			modes.some((m) => fromPath.startsWith(m.href + '/'));
		if (!fromIsSub && toIsSub) {
			slideDir = 1;
			return;
		}
		if (fromIsSub && !toIsSub) {
			slideDir = -1;
			return;
		}
		const fromIdx = modes.findIndex((m) => fromPath === m.href);
		const toIdx = modes.findIndex((m) => toPath === m.href);
		if (fromIdx !== -1 && toIdx !== -1) {
			slideDir = toIdx > fromIdx ? 1 : -1;
		}
	});

	function onPointerDown(e: PointerEvent) {
		pointerStartX = e.clientX;
		pointerStartY = e.clientY;
	}

	function onPointerUp(e: PointerEvent) {
		const dx = pointerStartX - e.clientX;
		const dy = pointerStartY - e.clientY;

		if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 40) return;

		const tabHref = modes[currentIndex]?.href;
		if (tabHref && page.url.pathname !== tabHref) {
			if (dx < 0) goto(resolve(tabHref));
			return;
		}

		const next = currentIndex + (dx > 0 ? 1 : -1);
		if (next >= 0 && next < modes.length) {
			slideDir = dx > 0 ? 1 : -1;
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
			slideDir = newIndex > curIdx ? 1 : -1;
			goto(resolve(modes[newIndex].href));
		}
	});
</script>

<main
	class="w:720px h:720px r:full flex ai:center jc:center flex-shrink:0"
	style="touch-action: none; cursor: {CURSOR_VISIBLE ? 'default' : 'none'} !important;"
	onpointerdown={onPointerDown}
	onpointerup={onPointerUp}
>
	<div class="fixed top:10px left:10px fg:white">{VERSION}</div>
	<div class="w:100% h:100% overflow:hidden r:full rel">
		{#key page.url.pathname}
			<div
				class="abs inset:0 flex ai:center jc:center"
				in:fly={{ x: slideDir * 560, duration: 380, easing: cubicOut }}
				out:fly={{ x: -slideDir * 560, duration: 380, easing: cubicOut }}
			>
				{@render children?.()}
			</div>
		{/key}

		{#if isMainPage}
			<Nav />
		{/if}

		{#if IS_PHYSICS && showPhysicsControls}
			<PhysicsControls disableToggle={isSubPage} />
		{/if}
	</div>
</main>
