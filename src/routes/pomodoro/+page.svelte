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

	// セットアップUI用のローカル設定値
	let workMinutes = $state(25);
	let restMinutes = $state(5);
	let loopCount = $state(10);

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.document.body.style.backgroundColor = '#2f2f2f';
		}
	});
</script>

<div class="rel w:full h:full r:full bg:#2f2f2f overflow:hidden" aria-label="pomodoro timer">
	<!-- Decorative concentric rings -->
	<div class="ring" style="width: 672px; height: 672px;"></div>
	<div class="ring" style="width: 554px; height: 554px;"></div>
	<div class="ring" style="width: 436px; height: 436px;"></div>

	{#if $pomodoroPhase === 'idle'}
		<!-- ─── Setup state ─── -->
		<div class="content-wrap">
			<!-- Time controls row -->
			<div class="controls-row">
				<!-- Work time (large, left) -->
				<div class="flex flex:column ai:center gap:4px">
					<button class="arrow-btn" onclick={() => (workMinutes = Math.min(workMinutes + 1, 99))}>
						<svg width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M1 11L10 2L19 11" stroke="#797979" stroke-width="2.5" stroke-linecap="round"/></svg>
					</button>
					<span class="work-num">{workMinutes}</span>
					<button class="arrow-btn" onclick={() => (workMinutes = Math.max(workMinutes - 1, 1))}>
						<svg width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M1 1L10 10L19 1" stroke="#797979" stroke-width="2.5" stroke-linecap="round"/></svg>
					</button>
					<span class="ctrl-label">作業時間(分)</span>
				</div>

				<!-- Rest + Loop controls (right, stacked) -->
				<div class="flex flex:column gap:16px ai:start">
					<!-- Rest time -->
					<div class="flex ai:center gap:10px">
						<div class="flex flex:column ai:center gap:2px">
							<button class="arrow-btn-sm" onclick={() => (restMinutes = Math.min(restMinutes + 1, 30))}>
								<svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 8L7 2L13 8" stroke="#797979" stroke-width="2" stroke-linecap="round"/></svg>
							</button>
							<span class="sub-num">{restMinutes}</span>
							<button class="arrow-btn-sm" onclick={() => (restMinutes = Math.max(restMinutes - 1, 1))}>
								<svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 1L7 7L13 1" stroke="#797979" stroke-width="2" stroke-linecap="round"/></svg>
							</button>
						</div>
						<span class="sub-label">休憩時間(分)</span>
					</div>

					<!-- Loop count -->
					<div class="flex ai:center gap:10px">
						<div class="flex flex:column ai:center gap:2px">
							<button class="arrow-btn-sm" onclick={() => (loopCount = Math.min(loopCount + 1, 99))}>
								<svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 8L7 2L13 8" stroke="#797979" stroke-width="2" stroke-linecap="round"/></svg>
							</button>
							<span class="sub-num">{loopCount}</span>
							<button class="arrow-btn-sm" onclick={() => (loopCount = Math.max(loopCount - 1, 1))}>
								<svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 1L7 7L13 1" stroke="#797979" stroke-width="2" stroke-linecap="round"/></svg>
							</button>
						</div>
						<span class="sub-label">ループ回数</span>
					</div>
				</div>
			</div>

			<!-- Play button -->
			<button class="play-btn" onclick={() => startTimer(workMinutes, restMinutes, loopCount)}>
				<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
					<polygon points="10,5 31,18 10,31" fill="#f7f7f7"/>
				</svg>
			</button>

			<!-- Task count -->
			<div class="task-count-wrap">
				<span class="task-num">{$pendingTasks.length}</span>
				<span class="task-label">Tasks</span>
			</div>
		</div>

	{:else}
		<!-- ─── Active / Break state ─── -->
		<div class="content-wrap">
			<!-- Status + progress -->
			<div class="flex ai:center jc:center gap:20px">
				<span
					class="status-text"
					style="color: {$pomodoroPhase === 'work' ? '#e68938' : '#50c2fb'};"
				>
					{$pomodoroPhase === 'work' ? '作業中' : '休憩中'}
				</span>
				<span class="progress-text">
					<span class="progress-cur">{$pomodoroLoop.current}</span>
					<span class="progress-sep">/{$pomodoroLoop.total}</span>
				</span>
			</div>

			<!-- Timer display -->
			<div class="timer-display">{$pomodoroTimeDisplay}</div>

			<!-- Control buttons -->
			<div class="flex ai:center jc:center gap:12px">
				<!-- Stop -->
				<button class="ctrl-btn" style="width: 101px;" onclick={stopTimer}>
					<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
						<rect x="4" y="4" width="20" height="20" rx="2" fill="#f7f7f7"/>
					</svg>
				</button>

				<!-- Pause / Resume -->
				<button class="ctrl-btn" style="width: 130px;" onclick={togglePause}>
					{#if $isPaused}
						<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
							<polygon points="7,3 25,14 7,25" fill="#f7f7f7"/>
						</svg>
					{:else}
						<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
							<rect x="5" y="4" width="7" height="20" rx="2" fill="#f7f7f7"/>
							<rect x="16" y="4" width="7" height="20" rx="2" fill="#f7f7f7"/>
						</svg>
					{/if}
				</button>

				<!-- Skip -->
				<button class="ctrl-btn" style="width: 130px;" onclick={skipInterval}>
					<svg width="32" height="28" viewBox="0 0 32 28" fill="none">
						<polygon points="4,3 21,14 4,25" fill="#f7f7f7"/>
						<rect x="24" y="3" width="5" height="22" rx="2" fill="#f7f7f7"/>
					</svg>
				</button>
			</div>

			<!-- Task count -->
			<div class="task-count-wrap">
				<span class="task-num">{$pendingTasks.length}</span>
				<span class="task-label">Tasks</span>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Decorative rings */
	.ring {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		border: 1px solid #353535;
		pointer-events: none;
	}

	/* Main content layout */
	.content-wrap {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 20px;
		padding: 64px 48px;
	}

	/* Setup: controls row (work + rest/loop side by side) */
	.controls-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 36px;
	}

	/* Large work-time number */
	.work-num {
		font-size: 7.5rem;
		font-weight: 600;
		color: #f7f7f7;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	/* Smaller rest/loop numbers */
	.sub-num {
		font-size: 3.75rem;
		font-weight: 600;
		color: #797979;
		line-height: 1;
	}

	/* Labels */
	.ctrl-label {
		font-size: 1rem;
		font-weight: 700;
		color: #797979;
		margin-top: 6px;
		white-space: nowrap;
	}

	.sub-label {
		font-size: 0.85rem;
		font-weight: 700;
		color: #5a5a5a;
		white-space: nowrap;
	}

	/* Arrow buttons */
	.arrow-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 6px 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
		transition: opacity 0.15s;
	}
	.arrow-btn:hover { opacity: 1; }

	.arrow-btn-sm {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 4px 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
		transition: opacity 0.15s;
	}
	.arrow-btn-sm:hover { opacity: 1; }

	/* Play button */
	.play-btn {
		width: 255px;
		height: 87px;
		background: #242424;
		border: 1px solid #4d4d4d;
		border-radius: 44px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}
	.play-btn:hover { background: #2e2e2e; }

	/* Task count */
	.task-count-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1;
	}

	.task-num {
		font-size: 8rem;
		font-weight: 700;
		color: #df4242;
		line-height: 1;
	}

	.task-label {
		font-size: 2.4rem;
		font-weight: 700;
		color: #797979;
		letter-spacing: 0.1em;
		margin-top: 4px;
	}

	/* Active/Break: status text */
	.status-text {
		font-size: 2.2rem;
		font-weight: 600;
		font-family: 'Capitana', 'Reddit Sans', sans-serif;
	}

	.progress-text {
		display: flex;
		align-items: baseline;
		gap: 2px;
	}

	.progress-cur {
		font-size: 2.75rem;
		font-weight: 600;
		color: #f7f7f7;
	}

	.progress-sep {
		font-size: 1.8rem;
		font-weight: 500;
		color: #797979;
	}

	/* Timer display */
	.timer-display {
		font-size: 5.5rem;
		font-weight: 600;
		color: #f7f7f7;
		letter-spacing: 0.02em;
		font-family: 'Reddit Sans', sans-serif;
	}

	/* Control buttons */
	.ctrl-btn {
		height: 87px;
		background: #242424;
		border: 1px solid #4d4d4d;
		border-radius: 20px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}
	.ctrl-btn:hover { background: #2e2e2e; }
</style>
