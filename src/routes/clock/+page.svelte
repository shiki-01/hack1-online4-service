<script lang="ts">
	import { onMount } from 'svelte';
	import { pendingTasks, countColor } from '$lib/localTasks';
	import { pomodoroPhase, pomodoroTimeDisplay } from '$lib/pomodoroStore';

	let now = $state(new Date());
	let frameId: number | undefined;

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.document.body.className = 'bg:background';
		}
		const tick = () => {
			now = new Date();
			frameId = requestAnimationFrame(tick);
		};
		frameId = requestAnimationFrame(tick);
		return () => {
			if (frameId !== undefined) cancelAnimationFrame(frameId);
		};
	});

	const h = $derived(now.getHours());
	const m = $derived(now.getMinutes());
	const s = $derived(now.getSeconds());
	const ms = $derived(now.getMilliseconds());
	const mo = $derived(now.getMonth() + 1);
	const d = $derived(now.getDate());
	const wd = $derived(now.getDay());
	const h12 = $derived(h % 12 || 12);
	const hh = $derived(String(h).padStart(2, '0'));
	const mm = $derived(String(m).padStart(2, '0'));
	const week = ['日', '月', '火', '水', '木', '金', '土'];

	const secondDeg = $derived(((s + ms / 1000) / 60) * 360);
	const minuteDeg = $derived(((m + s / 60 + ms / 60000) / 60) * 360);
	const hourDeg = $derived((((h % 12) + m / 60 + s / 3600) / 12) * 360);
	const numerals = Array.from({ length: 12 }, (_, i) => i + 1);
</script>

<div class="rel w:full h:full r:full bg:base-5" aria-label="analog clock">
	{#each numerals as n (n)}
		<div
			class="numeral abs top:50% left:50% w:fit h:fit grid place-items:center f:4rem line-h:1em font-weight:700 user-select:none fg:#424242"
			class:active={h12 === n}
			style="--angle: {n * 30}deg;"
		>
			{n}
		</div>
	{/each}

	<div
		class="hand z:3 w:8px h:260px bg:#F1F1F1::before"
		style="transform:translateX(-50%) rotate({hourDeg}deg);"
	></div>
	<div
		class="hand z:2 w:8px h:320px bg:#878787::before"
		style="transform:translateX(-50%) rotate({minuteDeg}deg);"
	></div>
	<div
		class="hand z:1 w:4px h:320px bg:#4E4E4E::before"
		style="transform:translateX(-50%) rotate({secondDeg}deg);"
	></div>

	<div
		class="abs top:50% left:50% translate(-50%,-50%) w:368px square r:50% bg:base-6 z:5 flex flex:column ai:center jc:center gap:8px"
	>
		{#if $pomodoroPhase !== 'idle'}
			<div class="flex flex:column ai:center jc:center w:206px h:79px bg:base-5 r:54px gap:2px">
				<span
					class="f:1.4rem font-weight:700 line-h:1 fg:{$pomodoroPhase === 'work'
						? 'orange-1'
						: 'blue-1'}"
				>
					{$pomodoroPhase === 'work' ? '作業中' : '休憩中'}
				</span>
				<span class="f:2.3rem font-weight:600 fg:base-1 line-h:1 font-family:reddit-sans,sans-serif"
					>{$pomodoroTimeDisplay}</span
				>
			</div>
		{:else}
			<div class="flex flex:column gap:6px ai:center">
				<span class="f:2.5rem font-weight:500 ls:0.05em fg:base-1">{hh}:{mm}</span>
				<span class="f:1.2rem font-weight:500 fg:#777676">{mo}月{d}日 ({week[wd]})</span>
			</div>
		{/if}
		<div class="flex ai:baseline gap:8px">
			<span
				class="f:10rem font-weight:700 line-h:1 fg:{countColor($pendingTasks.length)} ~color|0.5s"
			>
				{$pendingTasks.length}
			</span>
		</div>
		<span class="f:2rem font-weight:700 fg:#9D9D9D ls:0.1em">Tasks</span>
	</div>
</div>

<style>
	.numeral {
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-300px)
			rotate(calc(-1 * var(--angle)));
		transition: color 0.4s;
	}

	.numeral.active {
		color: #eee;
	}

	.hand {
		position: absolute;
		left: 50%;
		bottom: 50%;
		transform-origin: 50% 100%;
	}

	.hand::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 200px;
		border-radius: 999px;
	}
</style>
