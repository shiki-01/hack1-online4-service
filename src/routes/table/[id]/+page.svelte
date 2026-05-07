<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { localTasks, completeLocalTask, removeLocalTask, deadlineColor, dueDateLabel } from '$lib/localTasks';
	import { get } from 'svelte/store';
	import { physicsRotation, physicsClickCount } from '$lib/physicsController';
	import { onMount } from 'svelte';

	const IS_PHYSICS = import.meta.env.VITE_IS_PHYSICS === 'true';

	const now = new Date();
	const dateStr = `${now.getMonth() + 1}月${now.getDate()}日（${'日月火水木金土'[now.getDay()]}）`;
	const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

	const id = $derived(page.params.id);
	const task = $derived(get(localTasks).find((t) => t.id === id));

	$effect(() => {
		if (!task) goto(resolve('/table'));
	});

	function formatDate(date: Date): string {
		return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
	}

	function handleComplete() {
		if (!task) return;
		completeLocalTask(task.id!);
		goto(resolve('/table'));
	}

	function handleDelete() {
		if (!task) return;
		removeLocalTask(task.id!);
		goto(resolve('/table'));
	}

	function handleBack() {
		goto(resolve('/table'));
	}

	// ---- Physics: ノブでアクション選択、ボタンで確定 ----
	/** アクション順序: 戻る → 完了 → 削除 */
	const ACTIONS = ['back', 'complete', 'delete'] as const;
	type Action = (typeof ACTIONS)[number];

	/** ノブ 60度 ごとに 1 アクション移動 */
	const ACTION_DEG = 60;

	let selectedAction = $state<Action>('back');

	/**
	 * このページに入った瞬間の回転値をベースラインとして保持。
	 * これにより、ページナビゲーションで積算された回転値に影響されない。
	 */
	const baseRotation = get(physicsRotation);

	/** ノブ回転でアクション選択 (常に有効) */
	$effect(() => {
		if (!IS_PHYSICS) return;
		const delta = $physicsRotation - baseRotation;
		const rawIndex = Math.round(delta / ACTION_DEG);
		const clampedIndex = Math.max(0, Math.min(rawIndex, ACTIONS.length - 1));
		selectedAction = ACTIONS[clampedIndex];
	});

	/** ボタンクリック → 選択中アクションを実行 (常に有効) */
	let prevClickCount = get(physicsClickCount);
	$effect(() => {
		if (!IS_PHYSICS) return;
		const count = $physicsClickCount;
		if (count === prevClickCount) return;
		prevClickCount = count;
		if (selectedAction === 'back') handleBack();
		else if (selectedAction === 'complete') handleComplete();
		else if (selectedAction === 'delete') handleDelete();
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.document.body.className = 'bg:background';
		}
	});
</script>

<div class="rel w:100% h:100% bg:base-6 flex flex:column ai:center jc:center px:48px box-sizing:border-box">

	<div class="abs top:52px left:50% translateX(-50%) pointer-events:none">
		<span class="f:0.75rem color:#888 ls:0.04em white-space:nowrap">{dateStr} {timeStr}</span>
	</div>

	{#if task}
		<div class="w:100% max-w:380px flex flex:column gap:12px">
			<h1 class="f:1rem font-weight:700 color:#f0f0f0 m:0 lh:1.3">{task.title}</h1>

			<div class="flex ai:center gap:6px">
				<span class="w:7px h:7px r:full flex-shrink:0" style="background:{deadlineColor(task.dueDate)}"></span>
				<span class="f:0.8rem font-weight:600" style="color:{deadlineColor(task.dueDate)}">
					{dueDateLabel(task.dueDate)}
					{#if task.dueDate}
						<span class="font-weight:400 color:#666 ml:4px">（{formatDate(task.dueDate)}）</span>
					{/if}
				</span>
			</div>

			{#if task.description}
				<p class="f:0.82rem color:#888 line-h:1.6rem m:0">{task.description}</p>
			{:else}
				<p class="f:0.82rem color:#444 line-h:1.6rem m:0 font-style:italic">説明なし</p>
			{/if}

			<div class="mt:4">
				<span class="f:0.7rem color:#555 bg:#232323 b:1px|solid|#2e2e2e r:25px px:10px py:3px">{task.category}</span>
			</div>
		</div>

		<div class="flex gap:16 mt:32 w:100% max-w:380px">
			<button
				class="action-btn action-btn--delete"
				class:phy-selected={IS_PHYSICS && selectedAction === 'delete'}
				onclick={handleDelete}
				aria-label="削除"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
					<path d="M10 11v6M14 11v6" />
					<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
				</svg>
			</button>

			<button
				class="action-btn action-btn--complete"
				class:phy-selected={IS_PHYSICS && selectedAction === 'complete'}
				onclick={handleComplete}
				aria-label="完了"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12" />
				</svg>
			</button>
		</div>
	{/if}

	<button
		class="abs top:200px left:150px bg:none b:none color:#555 px:6 py:4 flex ai:center gap:4 r:8 cursor:pointer transition:color|0.15s hover:color:#aaa"
		class:phy-back-selected={IS_PHYSICS && selectedAction === 'back'}
		onclick={handleBack}
		aria-label="一覧に戻る"
	>
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="15 18 9 12 15 6" />
		</svg>
		<span style="font-size:0.75rem;letter-spacing:0.03em;">一覧</span>
	</button>
</div>

<style>
	.action-btn {
		flex: 1;
		height: 48px;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.15s, transform 0.1s, background 0.15s;
	}

	.action-btn:active {
		transform: scale(0.96);
		opacity: 0.8;
	}

	.action-btn--delete {
		background: #2a1a1a;
		color: #cc4444;
		border: 1px solid #3a2020;
	}

	.action-btn--complete {
		background: #1a2a1a;
		color: #44cc66;
		border: 1px solid #203a20;
	}

	/* Physics: 選択中アクションのハイライト */
	.phy-selected {
		box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.6);
		filter: brightness(1.3);
	}

	.phy-back-selected {
		color: #4ecdc4 !important;
	}
</style>
