<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { pendingTasks, deadlineColor, countColor, dueDateLabel } from '$lib/localTasks';
	import gsap from 'gsap';
	import CircleClock from '$lib/components/CircleClock.svelte';
	import { physicsRotation, physicsClickCount, modeSwitchEnabled } from '$lib/physicsController';
	import { get } from 'svelte/store';
	import { pageTransition, skipAnimationOnce } from '$lib/transitionStore';
	import { EASE_OUT, EASE_IN } from '$lib/easings';

	const IS_PHYSICS = import.meta.env.VITE_IS_PHYSICS === 'true';
	const ITEM_DEG = 30;

	let tablePageEl: HTMLDivElement | undefined = $state();
	let tableContentEl: HTMLDivElement | undefined = $state();
	let taskCountEl: HTMLDivElement | undefined = $state();
	let itemBaseRotation = 0;
	let prevClickCount = get(physicsClickCount);
	let drum = $state<HTMLDivElement | null>(null);
	let currentIndex = $state(0);
	let isAnimating = false;
	let isDragging = false;
	let activePointerId: number | null = null;
	let dragStartY = 0;
	let dragStartRotation = 0;
	let currentRotationX = 0;
	let didDrag = false;
	let pointerStartTaskId: string | null = null;
	let scrollProgress = $state(0);

	const CARD_ANGLE = 22;
	const CYLINDER_R = 260;
	const WHEEL_PX_PER_ITEM = 1000;
	const DRAG_ROTATION_FACTOR = 0.15;
	const DRAG_START_PX = 6;

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
		updateScrollProgress();
	}

	function rotateTo(index: number) {
		if (isAnimating || !drum) return;
		isAnimating = true;
		const clampedIndex = clampIndex(index);
		currentIndex = clampedIndex;
		currentRotationX = clampedIndex * CARD_ANGLE;
		updateScrollProgress();
		gsap.to(drum, {
			rotationX: currentRotationX,
			duration: 0.3,
			ease: 'power3.out',
			onComplete: () => {
				isAnimating = false;
			}
		});
	}

	function updateScrollProgress() {
		const maxRotation = Math.max(0, ($pendingTasks.length - 1) * CARD_ANGLE);
		if (maxRotation <= 0) {
			scrollProgress = 0;
			return;
		}
		scrollProgress = Math.max(0, Math.min(currentRotationX / maxRotation, 1));
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
		didDrag = false;
		pointerStartTaskId =
			e.target instanceof Element
				? (e.target.closest<HTMLElement>('[data-task-id]')?.dataset.taskId ?? null)
				: null;
		isAnimating = false;
		gsap.killTweensOf(drum);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging || e.pointerId !== activePointerId) return;
		const delta = dragStartY - e.clientY;
		if (!didDrag && Math.abs(delta) < DRAG_START_PX) return;
		didDrag = true;
		setRotation(dragStartRotation + delta * DRAG_ROTATION_FACTOR);
	}

	function onPointerUp(e: PointerEvent) {
		if (!isDragging || e.pointerId !== activePointerId) return;

		const swipeDy = dragStartY - e.clientY; // 正 = 上スワイプ、負 = 下スワイプ

		isDragging = false;
		activePointerId = null;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

		if (!didDrag && pointerStartTaskId) {
			// タップ → タスク詳細へ（履歴に積まない）
			goto(resolve('/table/[id]', { id: pointerStartTaskId }), { replaceState: true });
		} else if (didDrag && swipeDy < -80 && currentIndex === 0 && dragStartRotation === 0) {
			// 先頭にいるときの大きな下スワイプ → /table を閉じて前のページへ戻る
			e.stopPropagation();
			history.back();
		} else {
			// 通常ドラッグ → カルーセルをスナップ、レイアウト側の誤検知を防ぐ
			e.stopPropagation();
			rotateTo(currentIndex);
		}

		didDrag = false;
		pointerStartTaskId = null;
	}

	function onPointerCancel(e: PointerEvent) {
		if (!isDragging || e.pointerId !== activePointerId) return;
		isDragging = false;
		activePointerId = null;
		didDrag = false;
		pointerStartTaskId = null;
		rotateTo(currentIndex);
	}

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
		if (task) goto(resolve('/table/[id]', { id: task.id }), { replaceState: true });
	});

	/** スクロール位置に応じてタスクカウントをフェード */
	$effect(() => {
		if (!taskCountEl) return;
		if (currentIndex > 0) {
			gsap.to(taskCountEl, { opacity: 0, duration: 0.1, ease: EASE_IN });
		} else {
			gsap.to(taskCountEl, { opacity: 1, duration: 0.3, ease: EASE_OUT });
		}
	});

	let exitTl: gsap.core.Timeline | undefined;

	/** テーブルからの退場アニメーション（共通） */
	$effect(() => {
		const t = $pageTransition;
		if (!t || t.from !== '/table') return;
		if (!tableContentEl) return;

		const toPath = t.to;
		exitTl?.kill();
		const tl = gsap.timeline({
			onComplete: () => {
				skipAnimationOnce.set(true);
				if (toPath === '/clock') {
					goto(resolve('/clock'));
				} else if (toPath === '/pomodoro') {
					goto(resolve('/pomodoro'));
				} else if (toPath === '/stack') {
					goto(resolve('/stack'));
				} else if (toPath === '/settings') {
					goto(resolve('/settings'));
				} else if (toPath === '/table') {
					goto(resolve('/table'));
				} else if (toPath.startsWith('/table/')) {
					const id = decodeURIComponent(toPath.slice('/table/'.length));
					goto(resolve('/table/[id]', { id }));
				}
			}
		});
		exitTl = tl;

		if (taskCountEl) {
			tl.to(taskCountEl, {
				y: 200,
				scale: 0.9,
				duration: 0.5,
				ease: EASE_IN
			});
		}
		const cardEls = tableContentEl.querySelectorAll('.card-inner');
		if (cardEls.length) {
			tl.to(
				cardEls,
				{
					opacity: 0,
					y: -10,
					duration: 0.2,
					ease: EASE_IN,
					stagger: { amount: 0.1, from: 'center' }
				},
				0
			);
		}
		tl.to(tableContentEl, { scale: 1.06, duration: 0.28, ease: EASE_IN }, 0);

		return () => {
			exitTl?.kill();
		};
	});

	onMount(() => {
		if (drum) {
			currentRotationX = 0;
			gsap.set(drum, { rotationX: 0 });
			updateScrollProgress();
		}

		const t = get(pageTransition);
		if (t?.from && tableContentEl && taskCountEl) {
			gsap.from(taskCountEl, {
				y: 200,
				scale: 0.9,
				duration: 0.6,
				ease: EASE_OUT
			});
			gsap.from(tableContentEl, {
				scale: 1.06,
				duration: 0.35,
				ease: EASE_OUT
			});
			const cardEls = tableContentEl.querySelectorAll('.card-inner');
			if (cardEls.length) {
				gsap.from(cardEls, {
					opacity: 0,
					y: 10,
					duration: 0.3,
					ease: EASE_OUT,
					stagger: { amount: 0.12, from: 'center' },
					delay: 0.05
				});
			}
		}
	});
</script>

<div
	class="rel w:full h:full flex flex:column ai:center jc:center bg:base-6 overflow:hidden"
	bind:this={tablePageEl}
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

	<div class="abs inset:0 flex ai:center jc:center" bind:this={tableContentEl}>
		<div class="abs z:999 w:684px square top:50% left:50% translate(-50%,-50%) pointer-events:none">
			<div class="rel w:full h:full">
				<svg
					class="abs z:0 top:50% left:50% translate(-50%,-50%)"
					width="684"
					height="684"
					viewBox="0 0 684 684"
				>
					<path
						class="stroke:base-4"
						d="M 642 266 A 300 300 0 0 1 642 433"
						fill="none"
						stroke-linecap="round"
						stroke-width="12"
					/>
				</svg>
				<svg
					class="abs z:1 top:50% left:50% translate(-50%,-50%)"
					width="684"
					height="684"
					viewBox="0 0 684 684"
				>
					<path
						class="stroke:base-1 ~stroke-dashoffset|200ms"
						d="M 642 266 A 300 300 0 0 1 642 433"
						fill="none"
						stroke-linecap="round"
						stroke-width="12"
						stroke-dasharray="25 148"
						stroke-dashoffset={-scrollProgress * 148}
					/>
				</svg>
			</div>
		</div>

		<div
			bind:this={taskCountEl}
			class="abs top:60px left:50% translateX(-50%)|scale(0.76) flex flex:column ai:center jc:center"
		>
			<span
				class="f:10rem font-weight:700 line-h:1 fg:{countColor($pendingTasks.length)} ~color|0.5s"
			>
				{$pendingTasks.length}
			</span>
			<span class="f:2rem font-weight:700 fg:#9D9D9D ls:0.1em">Tasks</span>
		</div>

		<div
			class="perspective w:300px h:300px flex ai:center jc:center"
			style="transform-style:preserve-3d"
		>
			<div bind:this={drum} class="w:stretch h:90px rel transform-style:preserve-3d">
				{#each $pendingTasks as task, i (task.id)}
					{@const angle = i * CARD_ANGLE}
					{@const active = i === currentIndex}
					<div
						class="backface abs top:0 left:0 w:stretch h:stretch pointer-events:auto"
						data-task-id={task.id}
						role="button"
						tabindex={active ? 0 : -1}
						style="transform: rotateX({-angle}deg) translateZ({CYLINDER_R}px);"
						onkeydown={(e) => e.preventDefault()}
					>
						<div
							class="card-inner w:full h:full bg:#1e1e1e r:12px p:0|20px flex flex:column ai:start jc:center gap:7px box-sizing:border-box"
							class:active
						>
							<span
								class="card-title f:1rem line-h:1 fg:#cfcfcf font-weight:500 white-space:nowrap overflow:hidden text-overflow:ellipsis"
								class:active>{task.title}</span
							>
							<div class="flex ai:center gap:5px flex-shrink:0">
								<span class="w:6px h:6px r:full" style="background:{deadlineColor(task.dueDate)}"
								></span>
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
