<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { pendingTasks, deadlineColor } from '$lib/localTasks';
	import gsap from 'gsap';
	import CircleClock from '$lib/components/CircleClock.svelte';

	let drum = $state<HTMLDivElement | null>(null);
	let currentIndex = $state(0);
	let isAnimating = false;

	const CARD_ANGLE = 25;
	const CYLINDER_R = 200;

	function rotateTo(index: number) {
		if (isAnimating || !drum) return;
		isAnimating = true;
		const tasks = $pendingTasks;
		const clampedIndex = Math.max(0, Math.min(index, tasks.length - 1));
		currentIndex = clampedIndex;
		gsap.to(drum, {
			rotationX: clampedIndex * CARD_ANGLE,
			duration: 0.55,
			ease: 'power3.out',
			onComplete: () => {
				isAnimating = false;
			}
		});
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		rotateTo(currentIndex + (e.deltaY > 0 ? 1 : -1));
	}

	let pointerStartY = 0;
	function onPointerDown(e: PointerEvent) {
		pointerStartY = e.clientY;
	}
	function onPointerUp(e: PointerEvent) {
		const delta = pointerStartY - e.clientY;
		if (Math.abs(delta) > 20) rotateTo(currentIndex + (delta > 0 ? 1 : -1));
	}

	onMount(() => {
		if (drum) gsap.set(drum, { rotationX: 0 });
	});

	function dueDateLabel(dueDate: Date | null): string {
		if (!dueDate) return '期限なし';
		const days = (dueDate.getTime() - Date.now()) / 86_400_000;
		if (days < 0) return '期限切れ';
		if (days < 1) return '今日';
		if (days < 2) return '明日';
		return `${Math.ceil(days)}日後`;
	}
</script>

<div
	class="rel w:full h:full flex flex:column ai:center jc:center overflow:hidden"
	tabindex="0"
	role="button"
	onwheel={onWheel}
	onpointerdown={onPointerDown}
	onpointerup={onPointerUp}
	onkeydown={(e) => e.preventDefault()}
>
	<CircleClock />

	<div class="perspective w:300px h:220px flex ai:center jc:center">
		<div bind:this={drum} class="w:stretch h:72px rel transform-style:preserve-3d">
			{#each $pendingTasks as task, i (task.id)}
				{@const angle = i * CARD_ANGLE}
				{@const active = i === currentIndex}
				<div
					class="backface abs top:0 left:0 w:stretch h:stretch cursor:pointer"
					role="button"
					tabindex={active ? 0 : -1}
					style="transform: rotateX({-angle}deg) translateZ({CYLINDER_R}px);"
					onclick={() => goto(resolve('/table/[id]', { id: task.id }))}
					onkeydown={(e) => e.preventDefault()}
				>
					<div class="card-inner w:full h:full bg:#1e1e1e b:1px|solid|#2a2a2a r:12px p:0|20px flex ai:center jc:space-between gap:12px box-sizing:border-box" class:active>
						<span class="card-title f:0.9rem fg:#cfcfcf font-weight:500 white-space:nowrap overflow:hidden text-overflow:ellipsis flex:1" class:active>{task.title}</span>
						<div class="flex ai:center gap:5px flex-shrink:0">
							<span class="w:6px h:6px r:full" style="background:{deadlineColor(task.dueDate)}"></span>
							<span class="f:0.7rem font-weight:500" style="color:{deadlineColor(task.dueDate)}"
								>{dueDateLabel(task.dueDate)}</span
							>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.perspective {
		perspective: 600px;
	}
	.backface {
		backface-visibility: hidden;
	}

	.card-inner {
		transition:
			background 0.2s,
			border-color 0.2s;
	}

	.card-inner.active {
		background: #252525;
		border-color: #3a3a3a;
	}

	.card-title.active {
		color: #f0f0f0;
		font-weight: 600;
	}
</style>
