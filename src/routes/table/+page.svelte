<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { pendingTasks, deadlineColor } from '$lib/localTasks';
	import gsap from 'gsap';
	import CircleClock from '$lib/components/CircleClock.svelte';
	import { physicsRotation, physicsClickCount, modeSwitchEnabled } from '$lib/physicsController';
	import { get } from 'svelte/store';

	const IS_PHYSICS = import.meta.env.VITE_IS_PHYSICS === 'true';

	let drum = $state<HTMLDivElement | null>(null);
	let currentIndex = $state(0);
	let isAnimating = false;
	let isDragging = false;
	let activePointerId: number | null = null;
	let dragStartY = 0;
	let dragStartRotation = 0;
	let currentRotationX = 0;

	const CARD_ANGLE = 20;
	const CYLINDER_R = 240;
	const WHEEL_PX_PER_ITEM = 120;
	const DRAG_ROTATION_FACTOR = 0.15;

	function clampIndex(index: number) {
		const tasks = $pendingTasks;
		return Math.max(0, Math.min(index, tasks.length - 1));
	}

	function clampRotation(rotationX: number) {
		const maxRotation = clampIndex($pendingTasks.length - 1) * CARD_ANGLE;
		return Math.max(0, Math.min(rotationX, maxRotation));
	}

	function setRotation(rotationX: number) {
		if (!drum) return;
		currentRotationX = clampRotation(rotationX);
		currentIndex = clampIndex(Math.round(currentRotationX / CARD_ANGLE));
		gsap.set(drum, { rotationX: currentRotationX });
	}

	function rotateTo(index: number) {
		if (isAnimating || !drum) return;
		isAnimating = true;
		const clampedIndex = clampIndex(index);
		currentIndex = clampedIndex;
		currentRotationX = clampedIndex * CARD_ANGLE;
		gsap.to(drum, {
			rotationX: currentRotationX,
			duration: 0.55,
			ease: 'power3.out',
			onComplete: () => {
				isAnimating = false;
			}
		});
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const steps = Math.max(1, Math.round(Math.abs(e.deltaY) / WHEEL_PX_PER_ITEM));
		rotateTo(currentIndex + Math.sign(e.deltaY) * steps);
	}

	function onPointerDown(e: PointerEvent) {
		if (!drum) return;
		isDragging = true;
		activePointerId = e.pointerId;
		dragStartY = e.clientY;
		dragStartRotation = currentRotationX;
		isAnimating = false;
		gsap.killTweensOf(drum);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onPointerMove(e: PointerEvent) {
		if (!isDragging || e.pointerId !== activePointerId) return;
		const delta = dragStartY - e.clientY;
		setRotation(dragStartRotation + delta * DRAG_ROTATION_FACTOR);
	}
	function onPointerUp(e: PointerEvent) {
		if (!isDragging || e.pointerId !== activePointerId) return;
		isDragging = false;
		activePointerId = null;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		rotateTo(currentIndex);
	}
	function onPointerCancel(e: PointerEvent) {
		if (!isDragging || e.pointerId !== activePointerId) return;
		isDragging = false;
		activePointerId = null;
		rotateTo(currentIndex);
	}

	onMount(() => {
		if (drum) {
			currentRotationX = 0;
			gsap.set(drum, { rotationX: 0 });
		}
		if (typeof window !== "undefined") {
			window.document.body.style.backgroundColor = 'var(--base_6)'
		}
	});

	// ---- Physics: ノブでリスト操作 (modeSwitchEnabled=false 時) ----
	/** ノブ 30度 ごとに 1 アイテム移動 (感度調整) */
	const ITEM_DEG = 30;

	/** modeSwitchEnabled が false になった瞬間の回転ベースライン */
	import { untrack } from 'svelte';
	let itemBaseRotation = 0;

	$effect(() => {
		if (!IS_PHYSICS || $modeSwitchEnabled) return;
		// false になった瞬間にベースラインを取得
		untrack(() => {
			itemBaseRotation = get(physicsRotation);
		});
	});

	/** ノブ回転 → テーブルインデックス変換 */
	$effect(() => {
		if (!IS_PHYSICS || $modeSwitchEnabled) return;
		const tasks = $pendingTasks;
		if (tasks.length === 0) return;
		const delta = $physicsRotation - itemBaseRotation;
		const rawIndex = Math.round(delta / ITEM_DEG);
		const newIndex = clampIndex(rawIndex);
		if (newIndex !== currentIndex) rotateTo(newIndex);
	});

	/** ボタンクリック → 選択中アイテムに遷移 */
	let prevClickCount = get(physicsClickCount);
	$effect(() => {
		const count = $physicsClickCount;
		if (!IS_PHYSICS || $modeSwitchEnabled) {
			prevClickCount = count;
			return;
		}
		if (count === prevClickCount) return;
		prevClickCount = count;
		const tasks = $pendingTasks;
		const task = tasks[currentIndex];
		if (task) goto(resolve('/table/[id]', { id: task.id }));
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
	style="touch-action: none"
	onwheel={onWheel}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerCancel}
	onkeydown={(e) => e.preventDefault()}
>
	<CircleClock />

	<div class="perspective w:360px h:300px flex ai:center jc:center">
		<div bind:this={drum} class="w:stretch h:72px rel transform-style:preserve-3d">
			{#each $pendingTasks as task, i (task.id)}
				{@const angle = i * CARD_ANGLE}
				{@const active = i === currentIndex}
				<div
					class="backface abs top:0 left:0 w:stretch h:stretch"
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
