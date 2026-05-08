<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import gsap from 'gsap';
	import { goto } from '$app/navigation';
	import { pageTransition, skipAnimationOnce } from '$lib/transitionStore';
	import { EASE_OUT, EASE_IN } from '$lib/easings';
	import { resolve } from '$app/paths';
	import { localTasks, type LocalTask } from '$lib/localTasks';

	let pageEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		const t = get(pageTransition);
		if (!t || !pageEl) return;

		if (t.from === '/table') {
			gsap.from(pageEl, { scale: 0.94, opacity: 0, duration: 0.35, ease: EASE_OUT });
		} else if (t.from === '/clock' || t.from === '/pomodoro' || t.from === '/stack') {
			gsap.from(pageEl, { opacity: 0, duration: 0.3, ease: EASE_OUT });
		}
	});

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

	// ---- JSON editor (hidden, 3-tap to open) ----
	let showEditor = $state(false);
	let jsonText = $state('');
	let applyError = $state('');
	let tapCount = 0;
	let tapTimer: ReturnType<typeof setTimeout> | undefined;

	function handleTap() {
		tapCount++;
		clearTimeout(tapTimer);
		if (tapCount >= 3) {
			tapCount = 0;
			openEditor();
		} else {
			tapTimer = setTimeout(() => { tapCount = 0; }, 600);
		}
	}

	function openEditor() {
		const tasks = get(localTasks);
		jsonText = JSON.stringify(
			tasks.map(t => ({
				id: t.id,
				title: t.title,
				description: t.description,
				dueDate: t.dueDate?.toISOString() ?? null,
				priority: t.priority,
				category: t.category,
				status: t.status,
				subtasks: t.subtasks,
				createdAt: t.createdAt.toISOString(),
				updatedAt: t.updatedAt.toISOString()
			})),
			null, 2
		);
		showEditor = true;
		applyError = '';
	}

	function applyJson() {
		try {
			const parsed = JSON.parse(jsonText);
			if (!Array.isArray(parsed)) throw new Error('配列が必要です');
			const tasks: LocalTask[] = parsed.map((t: any) => ({
				...t,
				dueDate: t.dueDate ? new Date(t.dueDate) : null,
				createdAt: new Date(t.createdAt),
				updatedAt: new Date(t.updatedAt)
			}));
			localTasks.set(tasks);
			showEditor = false;
			applyError = '';
		} catch (e) {
			applyError = (e as Error).message;
		}
	}

	// ---- Mock presets (base: 2026-05-09) ----
	const BASE = '2026-05-09T12:00:00.000Z';
	let seq = 0;

	function mid() { return `t_mock_${(++seq).toString().padStart(3, '0')}`; }

	function mt(
		title: string,
		desc: string,
		dueDate: string | null,
		priority: 'low' | 'medium' | 'high',
		category: string
	) {
		return { id: mid(), title, description: desc, dueDate, priority, category, status: 'pending', subtasks: [], createdAt: BASE, updatedAt: BASE };
	}

	const presets: { label: string; tasks: ReturnType<typeof mt>[] }[] = [
		{
			label: '緊急',
			tasks: (() => {
				seq = 0;
				return [
					mt('映像アート論 課題提出', '課題提出は今週中。資料を提出する必要あり', '2026-05-06T00:00:00.000Z', 'high', '大学'),
					mt('レポート提出', '経済学のレポート。3000字以上', '2026-05-07T00:00:00.000Z', 'high', '大学'),
					mt('グループ発表の準備', 'スライド作成が全く終わっていない', '2026-05-08T00:00:00.000Z', 'high', '大学'),
					mt('友人への返信', 'LINEの未読が溜まっている', '2026-05-09T00:00:00.000Z', 'medium', '連絡'),
					mt('家賃振込', '口座残高を確認してから振り込む', '2026-05-09T00:00:00.000Z', 'high', '家事'),
					mt('プログラミング課題', 'Reactのコンポーネント設計課題', '2026-05-10T00:00:00.000Z', 'high', '大学'),
					mt('部屋の掃除', '', '2026-05-10T00:00:00.000Z', 'low', '家事'),
					mt('歯医者の予約', '虫歯が痛くなってきた', '2026-05-11T00:00:00.000Z', 'medium', '健康'),
					mt('洗濯', '', '2026-05-11T00:00:00.000Z', 'medium', '家事'),
					mt('読書感想文', '図書館で借りた本の感想文', '2026-05-12T00:00:00.000Z', 'medium', '大学'),
					mt('母への電話', '先月から後回しにしている', '2026-05-12T00:00:00.000Z', 'low', '連絡'),
					mt('Figma デザイン修正', 'プロトタイプのアニメーションを直す', '2026-05-13T00:00:00.000Z', 'medium', '大学'),
				];
			})()
		},
		{
			label: '普通',
			tasks: (() => {
				seq = 0;
				return [
					mt('洗濯', '', '2026-05-11T00:00:00.000Z', 'medium', '家事'),
					mt('友人への返信', '', '2026-05-12T00:00:00.000Z', 'medium', '連絡'),
					mt('Figma デザイン修正', 'プロトタイプのアニメーションを直す', '2026-05-13T00:00:00.000Z', 'medium', '大学'),
					mt('プログラミング課題', 'Reactのコンポーネント設計課題', '2026-05-16T00:00:00.000Z', 'high', '大学'),
					mt('映像アート論 課題提出', '課題提出期限まで余裕あり', '2026-05-18T00:00:00.000Z', 'high', '大学'),
					mt('歯医者の予約', '', '2026-05-20T00:00:00.000Z', 'medium', '健康'),
					mt('本を返却', '図書館の返却期限', '2026-05-23T00:00:00.000Z', 'low', 'その他'),
					mt('部屋の掃除', '', '2026-05-25T00:00:00.000Z', 'low', '家事'),
					mt('積みゲー消化', '', null, 'low', 'エンタメ'),
					mt('ジョギング', '', null, 'low', '健康'),
				];
			})()
		},
		{
			label: '余裕',
			tasks: (() => {
				seq = 0;
				return [
					mt('歯医者の予約', '', '2026-05-23T00:00:00.000Z', 'medium', '健康'),
					mt('Figma デザイン修正', 'プロトタイプのアニメーションを直す', '2026-05-29T00:00:00.000Z', 'medium', '大学'),
					mt('映像アート論 課題提出', '期末課題。まだ時間がある', '2026-06-03T00:00:00.000Z', 'high', '大学'),
					mt('本を返却', '図書館の返却期限', '2026-06-15T00:00:00.000Z', 'low', 'その他'),
					mt('旅行の計画', '夏休みの旅程を立てる', '2026-07-04T00:00:00.000Z', 'low', 'プライベート'),
					mt('積みゲー消化', '', null, 'low', 'エンタメ'),
				];
			})()
		}
	];

	function loadPreset(tasks: ReturnType<typeof mt>[]) {
		jsonText = JSON.stringify(tasks, null, 2);
		applyError = '';
	}
</script>

<div
	class="rel w:full h:full r:full flex ai:center jc:center bg:base-5 overflow:hidden"
	aria-label="settings"
	bind:this={pageEl}
>
	<span
		class="f:2rem font-weight:600 fg:base-2 cursor:default user-select:none"
		role="button"
		tabindex="0"
		onclick={handleTap}
		onkeydown={() => {}}
	>
		設定
	</span>

	{#if showEditor}
		<div class="abs inset:0 r:full overflow:hidden flex ai:center jc:center" style="background: rgba(10,10,10,0.96); z-index: 50;">
			<div class="flex flex:column ai:center gap:12px" style="width: 480px;">
				<div class="flex w:full ai:center jc:space-between px:8px">
					<span class="f:0.95rem font-weight:700 fg:base-1">タスク JSON</span>
					<button
						class="f:0.8rem fg:base-3 bg:transparent b:none cursor:pointer px:8px py:4px r:6px"
						style="border: 1px solid #333;"
						onclick={() => { showEditor = false; applyError = ''; }}
					>
						閉じる
					</button>
				</div>

				<div class="flex gap:8px">
					{#each presets as preset}
						<button
							class="f:0.75rem font-weight:600 fg:base-2 cursor:pointer px:12px py:6px r:99px"
							style="background: #2a2a2a; border: 1px solid #3a3a3a;"
							onclick={() => loadPreset(preset.tasks)}
						>
							{preset.label}
						</button>
					{/each}
				</div>

				<textarea
					bind:value={jsonText}
					spellcheck="false"
					style="
						width: 480px;
						height: 260px;
						background: #111;
						color: #ccc;
						border: 1px solid #333;
						border-radius: 10px;
						padding: 12px;
						font-family: monospace;
						font-size: 11px;
						line-height: 1.5;
						resize: none;
						outline: none;
						box-sizing: border-box;
						overflow-y: auto;
					"
				></textarea>

				{#if applyError}
					<span class="f:0.75rem fg:#FF4444">{applyError}</span>
				{/if}

				<button
					class="f:0.9rem font-weight:700 fg:base-1 cursor:pointer px:32px py:12px r:99px"
					style="background: #2a2a2a; border: 1px solid #444; width: 200px;"
					onclick={applyJson}
				>
					適用
				</button>
			</div>
		</div>
	{/if}
</div>
