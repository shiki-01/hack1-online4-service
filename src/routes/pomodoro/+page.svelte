<script lang="ts">
	import { onMount } from 'svelte';
	import { untrack } from 'svelte';
	import { get } from 'svelte/store';
	import { pendingTasks } from '$lib/localTasks';
	import {
		pomodoroPhase,
		pomodoroLoop,
		pomodoroTimeDisplay,
		isPaused,
		startTimer,
		stopTimer,
		togglePause,
		skipInterval
	} from '$lib/pomodoroStore';
	import { physicsRotation, physicsClickCount } from '$lib/physicsController';
	import CircleClock from '$lib/components/CircleClock.svelte';
	import TaskCount from '$lib/components/TaskCount.svelte';
	import gsap from 'gsap';
	import { goto } from '$app/navigation';
	import { pageTransition, skipAnimationOnce } from '$lib/transitionStore';
	import { EASE_OUT, EASE_IN } from '$lib/easings';
	import { resolve } from '$app/paths';

	const IS_PHYSICS = import.meta.env.VITE_IS_PHYSICS === 'true';
	const STEP_DEG = 5;

	let workMinutes = $state(25);
	let restMinutes = $state(5);
	let loopCount = $state(10);
	let countMode = $state<'work' | 'rest' | 'loop'>('work');

	// Knob baseline tracking (non-reactive)
	let baseRotation = 0;
	let baseWork = workMinutes;
	let baseRest = restMinutes;
	let baseLoop = loopCount;
	let prevClickCount = get(physicsClickCount);

	function resetBases() {
		baseRotation = get(physicsRotation);
		baseWork = workMinutes;
		baseRest = restMinutes;
		baseLoop = loopCount;
	}

	// Physical button click cycles through countMode
	$effect(() => {
		const count = $physicsClickCount;
		if (!IS_PHYSICS) { prevClickCount = count; return; }
		if (count === prevClickCount) return;
		prevClickCount = count;
		untrack(() => {
			countMode = countMode === 'work' ? 'rest' : countMode === 'rest' ? 'loop' : 'work';
			resetBases();
		});
	});

	// Knob rotation adjusts the selected field
	$effect(() => {
		if (!IS_PHYSICS) return;
		const rotation = $physicsRotation;
		const mode = countMode;
		const steps = Math.round((rotation - baseRotation) / STEP_DEG);
		untrack(() => {
			if (mode === 'work') {
				workMinutes = Math.max(1, Math.min(99, baseWork + steps));
			} else if (mode === 'rest') {
				restMinutes = Math.max(1, Math.min(30, baseRest + steps));
			} else {
				loopCount = Math.max(1, Math.min(99, baseLoop + steps));
			}
		});
	});

	let exitTl: gsap.core.Timeline | undefined;
	let frameId: number | undefined;

	let pageEl: HTMLDivElement | undefined = $state();
	let clockEl: HTMLDivElement | undefined = $state();
	let taskCountEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		resetBases();

		const tick = () => {
			frameId = requestAnimationFrame(tick);
		};
		frameId = requestAnimationFrame(tick);
		const t = get(pageTransition);
		const taskCountNode = taskCountEl?.firstElementChild as HTMLElement | null;

		if (t?.from === '/table' && pageEl && clockEl && taskCountNode) {
			// /table → /pomodoro エントリーアニメーション
			gsap.from(taskCountNode, { y: -400, duration: 0.3, ease: EASE_OUT });
			gsap.from(clockEl, { scale: 0.9, duration: 0.3, ease: EASE_OUT });
			gsap.from(pageEl, { width: 720, duration: 0.35, ease: EASE_OUT });
		} else if (t?.from === '/pomodoro' || t?.from === '/stack' || t?.from === '/settings') {
			gsap.from(taskCountNode, {
				transform: 'translateY(20px)',
				duration: 0.4,
				ease: EASE_OUT
			});
			if (pageEl) {
				gsap.from(pageEl, {
					transform: 'translate(0,-50%)',
					opacity: 0,
					duration: 0.4,
					ease: EASE_OUT
				});
			}
		}

		return () => {
			if (frameId !== undefined) cancelAnimationFrame(frameId);
		};
	});

	$effect(() => {
		const t = $pageTransition;
		if (!t || t.from !== '/pomodoro' || t.to !== '/table') return;
		const taskCountNode = taskCountEl?.firstElementChild as HTMLElement | null;
		if (!pageEl && !clockEl && !taskCountNode) return;

		exitTl?.kill();
		const tl = gsap.timeline({
			onComplete: () => {
				skipAnimationOnce.set(true);
				goto(resolve('/table'));
			}
		});
		exitTl = tl;

		if (taskCountNode) {
			tl.to(taskCountNode, { y: -400, duration: 0.3, ease: EASE_IN }, 0);
		}
		if (clockEl) {
			tl.to(clockEl, { scale: 0.9, duration: 0.28, ease: EASE_IN }, 0);
		}
		if (pageEl) {
			tl.to(pageEl, { width: 720, duration: 0.28, ease: EASE_IN }, 0);
		}

		return () => {
			exitTl?.kill();
		};
	});

	/** /pomodoro からの退場アニメーション（共通） */
	$effect(() => {
		const t = $pageTransition;
		console.log(t)
		if (!t || t.from !== '/pomodoro') return;
		if (t.to !== '/clock' && t.to !== '/stack' && t.to !== '/settings') return;

		const dest = t.to;
		const taskCountNode = taskCountEl?.firstElementChild as HTMLElement | null;
		if (!taskCountNode) return;
		console.log(dest)

		exitTl?.kill();
		const tl = gsap.timeline({
			onComplete: () => {
				skipAnimationOnce.set(true);
				goto(resolve(dest));
			}
		});
		exitTl = tl;

		if (taskCountNode) {
			tl.to(
				taskCountNode,
				{
					transform: 'translate(-50%,-160px) scale(1.1)',
					duration: 0.2,
					ease: EASE_OUT
				},
				0
			);
		}
		if (pageEl) {
			tl.to(
				pageEl,
				{
					transform: 'translate(0,-50%)',
					opacity: 0,
					duration: 0.2,
					ease: EASE_OUT
				},
				0
			);
		}

		return () => {
			exitTl?.kill();
		};
	});

	const modeLabel = $derived(
		countMode === 'work' ? '作業時間(分)' : countMode === 'rest' ? '休憩時間(分)' : 'ループ回数'
	);
</script>

<div class="rel w:full h:full r:full bg:base-5 overflow:hidden" aria-label="pomodoro timer">
	<CircleClock isPomodoro={true} />

	{#if $pomodoroPhase === 'idle'}
		<div
			bind:this={pageEl}
			class="abs top:50% left:50% translate(-50%,-50%) w:422px square r:999px bg:base-6 inset:0 flex flex:column ai:center jc:center gap:20px"
		>
			<div bind:this={clockEl} class="flex rel flex:column ai:center jc:center">
				<div class="flex flex:row gap:20px">
					<button
						aria-label="btn"
						class="arrow-btn"
						onclick={() => {
							if (countMode === 'work') {
								workMinutes = Math.max(workMinutes - 1, 1);
							} else if (countMode === 'rest') {
								restMinutes = Math.max(restMinutes - 1, 1);
							} else {
								loopCount = Math.max(loopCount - 1, 1);
							}
							resetBases();
						}}
					>
						<svg width="20" height="12" viewBox="0 0 20 12"
							><path
								d="M1 11L10 2L19 11"
								class="stroke:base-2"
								stroke-width="2.5"
								stroke-linecap="round"
							/></svg
						>
					</button>

					<div class="flex flex:row gap:12px jc:center ai:end">
						<div
							class="flex flex:column ai:center jc:end"
							role="button"
							tabindex="0"
							onclick={() => { countMode = 'work'; resetBases(); }}
							onkeydown={() => {}}
						>
							<span
								class="font-weight:600 fg:{countMode === 'work' ? 'base-1' : 'base-3'} line-h:1 ls:-0.02em ~font-size|150ms|ease-out"
								style="font-size: {countMode === 'work' ? '5.5rem' : '3rem'}"
							>
								{workMinutes}
							</span>
						</div>

						<div
							class="flex ai:center jc:start pb:8px"
							role="button"
							tabindex="0"
							onclick={() => { countMode = 'rest'; resetBases(); }}
							onkeydown={() => {}}
						>
							<span
								class="font-weight:600 fg:{countMode === 'rest' ? 'base-1' : 'base-3'} line-h:1 ~font-size|150ms|ease-out"
								style="font-size: {countMode === 'rest' ? '5.5rem' : '3rem'}"
							>
								{restMinutes}
							</span>
						</div>

						<div
							class="flex ai:center jc:start pb:8px"
							role="button"
							tabindex="0"
							onclick={() => { countMode = 'loop'; resetBases(); }}
							onkeydown={() => {}}
						>
							<span
								class="font-weight:600 fg:{countMode === 'loop' ? 'base-1' : 'base-3'} line-h:1 ~font-size|150ms|ease-out"
								style="font-size: {countMode === 'loop' ? '5.5rem' : '3rem'}"
							>
								{loopCount}
							</span>
						</div>
					</div>

					<button
						aria-label="btn"
						class="arrow-btn"
						onclick={() => {
							if (countMode === 'work') {
								workMinutes = Math.min(workMinutes + 1, 99);
							} else if (countMode === 'rest') {
								restMinutes = Math.min(restMinutes + 1, 30);
							} else {
								loopCount = Math.min(loopCount + 1, 99);
							}
							resetBases();
						}}
					>
						<svg width="20" height="12" viewBox="0 0 20 12"
							><path
								d="M1 1L10 10L19 1"
								class="stroke:base-2"
								stroke-width="2.5"
								stroke-linecap="round"
							/></svg
						>
					</button>
				</div>

				<span class="f:1.6em font-weight:700 fg:base-2 mt:6px white-space:nowrap">
					{modeLabel}
				</span>
			</div>

			<button
				aria-label="btn"
				class="w:255px h:87px bg:base-5 r:99px cursor:pointer flex ai:center jc:center"
				onclick={() => startTimer(workMinutes, restMinutes, loopCount)}
			>
				<svg width="36" height="36" viewBox="0 0 36 36">
					<polygon points="10,5 31,18 10,31" class="fill:base-1" />
				</svg>
			</button>
		</div>
	{:else}
		<div
			bind:this={pageEl}
			class="abs top:50% left:50% translate(-50%,-50%) w:422px square r:999px pb:50px bg:base-6 inset:0 flex flex:column ai:center jc:center gap:25px"
		>
			<span class="flex ai:baseline gap:2px">
				<span class="f:2rem font-weight:600 fg:base-1">{$pomodoroLoop.current}</span>
				<span class="f:1.4rem font-weight:500 fg:base-2">/{$pomodoroLoop.total}</span>
			</span>

			<div class="flex flex:column ai:center jc:center gap:0px">
				<span
					class="f:2.2rem font-weight:600 font-family:Capitana,'reddit-sans',sans-serif color:{$pomodoroPhase ===
					'work'
						? 'orange-1'
						: 'blue-1'}"
				>
					{$pomodoroPhase === 'work' ? '作業中' : '休憩中'}
				</span>
				<div
					class="f:5rem font-weight:600 fg:base-1 ls:0.02em font-family:'reddit-sans',sans-serif"
				>
					{$pomodoroTimeDisplay}
				</div>
			</div>

			<div class="grid h:87px grid-template-columns:87px|120px|87px gap:14px ai:center jc:center">
				<button
					aria-label="btn"
					class="w:full h:full bg:base-5 r:999px flex ai:center jc:center"
					onclick={stopTimer}
				>
					<svg width="28" height="28" viewBox="0 0 28 28">
						<rect x="4" y="4" width="20" height="20" rx="2" class="fill:base-1" />
					</svg>
				</button>

				<button
					class="w:full h:full bg:base-5 r:999px cursor:pointer flex ai:center jc:center"
					onclick={togglePause}
				>
					{#if $isPaused}
						<svg width="28" height="28" viewBox="0 0 28 28">
							<polygon points="7,3 25,14 7,25" class="fill:base-1" />
						</svg>
					{:else}
						<svg width="28" height="28" viewBox="0 0 28 28">
							<rect x="5" y="4" width="7" height="20" rx="2" class="fill:base-1" />
							<rect x="16" y="4" width="7" height="20" rx="2" class="fill:base-1" />
						</svg>
					{/if}
				</button>

				<button
					aria-label="btn"
					class="w:full h:full bg:base-5 r:999px flex ai:center jc:center"
					onclick={skipInterval}
				>
					<svg width="32" height="28" viewBox="0 0 32 28">
						<polygon points="4,3 21,14 4,25" class="fill:base-1" />
						<rect x="24" y="3" width="5" height="22" rx="2" class="fill:base-1" />
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<div bind:this={taskCountEl}>
		<TaskCount length={$pendingTasks.length} />
	</div>
</div>
