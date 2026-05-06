<script lang="ts">
	import { onMount } from 'svelte';
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
	import CircleClock from '$lib/components/CircleClock.svelte';

	let workMinutes = $state(25);
	let restMinutes = $state(5);
	let loopCount = $state(10);
	let countMode = $state<'work' | 'rest'>('work');

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.document.body.className = 'bg:background';
		}
	});
</script>

<div class="rel w:full h:full r:full bg:base-5 overflow:hidden" aria-label="pomodoro timer">
	<CircleClock isPomodoro={true} />

	{#if $pomodoroPhase === 'idle'}
		<div
			class="abs top:50% left:50% translate(-50%,-50%) w:422px square r:999px bg:base-6 inset:0 flex flex:column ai:center jc:center gap:20px"
		>
			<div class="flex rel flex:column ai:center jc:center">
				<div class="flex flex:row gap:20px">
					<button
						aria-label="btn"
						class="arrow-btn"
						onclick={() => {
							if (countMode === 'work') {
								workMinutes = Math.max(workMinutes - 1, 1);
							} else {
								restMinutes = Math.max(restMinutes - 1, 1);
							}
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

					<div class="w:228px flex flex:row gap:10px jc:center ai:end">
						<div
							class="w:{workMinutes < 10 ? 68 : 140}px flex flex:column ai:center jc:end gap:10px"
							role="button"
							tabindex="0"
							onclick={() => (countMode = countMode === 'work' ? 'rest' : 'work')}
							onkeydown={() => {}}
						>
							<span
								class="f:7.5rem font-weight:600 fg:{countMode === 'work'
									? 'base-1'
									: 'base-2'} line-h:1 ls:-0.02em"
							>
								{workMinutes}
							</span>
						</div>

						<div
							class="w:{restMinutes < 10 ? 38 : 78}px flex ai:center jc:start pb:8px"
							role="button"
							tabindex="0"
							onclick={() => (countMode = countMode === 'work' ? 'rest' : 'work')}
							onkeydown={() => {}}
						>
							<span
								class="f:4rem font-weight:600 fg:{countMode === 'work'
									? 'base-2'
									: 'base-1'} line-h:1"
							>
								{restMinutes}
							</span>
						</div>
					</div>

					<button
						aria-label="btn"
						class="arrow-btn"
						onclick={() => {
							if (countMode === 'work') {
								workMinutes = Math.min(workMinutes + 1, 99);
							} else {
								restMinutes = Math.min(restMinutes + 1, 30);
							}
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
					作業時間(分)
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

		<div class="abs top:50% right:30px translateY(-50%) flex flex:column ai:center gap:20px">
			<span class="f:0.85rem font-weight:700 fg:base-3 white-space:nowrap">ループ回数</span>
			<div class="flex flex:column ai:center gap:10px">
				<button
					aria-label="btn"
					class="arrow-btn-sm"
					onclick={() => (loopCount = Math.min(loopCount + 1, 99))}
				>
					<svg width="14" height="9" viewBox="0 0 14 9"
						><path
							d="M1 8L7 2L13 8"
							class="stroke:base-2"
							stroke-width="2"
							stroke-linecap="round"
						/></svg
					>
				</button>
				<span
					class="f:3.75rem w:100px square r:100px bg:base-6 flex ai:center jc:center font-weight:600 fg:base-2 line-h:1"
					>{loopCount}</span
				>
				<button
					aria-label="btn"
					class="arrow-btn-sm"
					onclick={() => (loopCount = Math.max(loopCount - 1, 1))}
				>
					<svg width="14" height="9" viewBox="0 0 14 9"
						><path
							d="M1 1L7 7L13 1"
							class="stroke:base-2"
							stroke-width="2"
							stroke-linecap="round"
						/></svg
					>
				</button>
			</div>
		</div>
	{:else}
		<div
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

	<div class="abs left:50% bottom:20px z:10 translateX(-50%) flex flex:column ai:center line-h:1">
		<span class="f:8rem font-weight:700 fg:red-1 line-h:1">{$pendingTasks.length}</span>
		<span class="f:2.4rem font-weight:700 fg:base-2 ls:0.1em mt:4px">Tasks</span>
	</div>
</div>
