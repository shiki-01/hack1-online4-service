<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import gsap from 'gsap';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { pageTransition, skipAnimationOnce } from '$lib/transitionStore';
	import { EASE_OUT, EASE_IN } from '$lib/easings';
	import { resolve } from '$app/paths';
	import { localTasks, type LocalTask } from '$lib/localTasks';
	import { currentLocale, langFiles, LOCALES, type Locale } from '$lib/languageStore';
	import { t } from '$lib/i18n';
	import { syncGoogleTasks } from '$lib/googleTasksStore';

	let pageEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		const tr = get(pageTransition);
		if (!tr || !pageEl) return;

		if (tr.from === '/table') {
			gsap.from(pageEl, { scale: 0.94, opacity: 0, duration: 0.35, ease: EASE_OUT });
		} else if (tr.from === '/clock' || tr.from === '/pomodoro' || tr.from === '/stack') {
			gsap.from(pageEl, { opacity: 0, duration: 0.3, ease: EASE_OUT });
		}
	});

	$effect(() => {
		const tr = $pageTransition;
		if (!tr || tr.from !== '/settings') return;
		if (tr.to !== '/clock' && tr.to !== '/pomodoro' && tr.to !== '/stack' && tr.to !== '/table') return;
		if (!pageEl) return;

		const dest = tr.to;
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

	// ---- 認証状態 ----
	const isAuthenticated = $derived(page.data.isAuthenticated ?? false);

	async function handleSync() {
		await syncGoogleTasks();
	}

	// ---- i18n ----
	const s = $derived(t($currentLocale));

	// ---- 言語切替 (通常設定) ----
	function setLocale(code: Locale) {
		currentLocale.set(code);
	}

	// ---- JSON エディタ (隠し設定: 3タップで開く) ----
	let showEditor = $state(false);
	let editorTab = $state<'tasks' | 'lang'>('tasks');

	// --- タスク JSON タブ ---
	let jsonText = $state('');
	let applyError = $state('');

	// --- 言語ファイル タブ ---
	let langFileLocale = $state<Locale>($currentLocale);
	let langFileText = $state('');
	let langFileSaveMsg = $state('');

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
			tasks.map((task) => ({
				id: task.id,
				title: task.title,
				description: task.description,
				dueDate: task.dueDate?.toISOString() ?? null,
				priority: task.priority,
				category: task.category,
				status: task.status,
				subtasks: task.subtasks,
				createdAt: task.createdAt.toISOString(),
				updatedAt: task.updatedAt.toISOString()
			})),
			null, 2
		);
		editorTab = 'tasks';
		loadLangFileForLocale(langFileLocale);
		showEditor = true;
		applyError = '';
	}

	function applyJson() {
		try {
			const parsed = JSON.parse(jsonText);
			if (!Array.isArray(parsed)) throw new Error(s.arrayRequired);
			const tasks: LocalTask[] = parsed.map((task) => ({
				...task,
				dueDate: task.dueDate ? new Date(task.dueDate) : null,
				createdAt: new Date(task.createdAt),
				updatedAt: new Date(task.updatedAt)
			}));
			localTasks.set(tasks);
			showEditor = false;
			applyError = '';
		} catch (e) {
			applyError = (e as Error).message;
		}
	}

	// ---- 言語ファイル タブ ----
	function loadLangFileForLocale(locale: Locale) {
		const files = get(langFiles);
		langFileText = files[locale] ?? '';
		langFileSaveMsg = '';
	}

	function onLangFileLocaleChange(locale: Locale) {
		langFileLocale = locale;
		loadLangFileForLocale(locale);
	}

	function saveLangFile() {
		langFiles.update((files) => ({ ...files, [langFileLocale]: langFileText }));
		langFileSaveMsg = s.langFileLoaded;
		setTimeout(() => { langFileSaveMsg = ''; }, 1500);
	}

	function loadLangFileIntoEditor() {
		const files = get(langFiles);
		const content = files[$currentLocale];
		if (content) {
			jsonText = content;
			editorTab = 'tasks';
			applyError = '';
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

	const presets: { labelKey: keyof typeof s; tasks: ReturnType<typeof mt>[] }[] = [
		{
			labelKey: 'urgent',
			tasks: (() => {
				seq = 0;
				return [
					mt('映像アート論 課題提出', '課題提出は今週中。資料を提出する必要あり', '2026-05-07T00:00:00.000Z', 'high', '大学'),
					mt('レポート提出', '経済学のレポート。3000字以上', '2026-05-08T00:00:00.000Z', 'high', '大学'),
					mt('家賃振込', '口座残高を確認してから振り込む', '2026-05-09T00:00:00.000Z', 'high', '家事'),
					mt('友人への返信', 'LINEの未読が溜まっている', '2026-05-09T00:00:00.000Z', 'medium', '連絡'),
					mt('プログラミング課題', 'Reactのコンポーネント設計課題', '2026-05-10T00:00:00.000Z', 'high', '大学'),
					mt('部屋の掃除', '', '2026-05-11T00:00:00.000Z', 'low', '家事'),
					mt('洗濯', '', '2026-05-12T00:00:00.000Z', 'medium', '家事'),
					mt('Figma デザイン修正', 'プロトタイプのアニメーションを直す', '2026-05-14T00:00:00.000Z', 'medium', '大学'),
					mt('読書感想文', '図書館で借りた本の感想文', '2026-05-16T00:00:00.000Z', 'medium', '大学'),
					mt('歯医者の予約', '虫歯が痛くなってきた', '2026-05-17T00:00:00.000Z', 'medium', '健康'),
					mt('本を返却', '図書館の返却期限', '2026-05-23T00:00:00.000Z', 'low', 'その他'),
					mt('ジョギング', '', null, 'low', '健康'),
				];
			})()
		},
		{
			labelKey: 'normal',
			tasks: (() => {
				seq = 0;
				return [
					mt('グループ発表の準備', 'スライド作成が終わっていない', '2026-05-09T00:00:00.000Z', 'high', '大学'),
					mt('部屋の掃除', '', '2026-05-10T00:00:00.000Z', 'low', '家事'),
					mt('洗濯', '', '2026-05-10T00:00:00.000Z', 'medium', '家事'),
					mt('歯医者の予約', '', '2026-05-12T00:00:00.000Z', 'medium', '健康'),
					mt('Figma デザイン修正', 'プロトタイプのアニメーションを直す', '2026-05-13T00:00:00.000Z', 'medium', '大学'),
					mt('プログラミング課題', 'Reactのコンポーネント設計課題', '2026-05-15T00:00:00.000Z', 'high', '大学'),
					mt('母への電話', '先月から後回しにしている', '2026-05-16T00:00:00.000Z', 'low', '連絡'),
					mt('本を返却', '図書館の返却期限', '2026-05-20T00:00:00.000Z', 'low', 'その他'),
					mt('積みゲー消化', '', null, 'low', 'エンタメ'),
					mt('ジョギング', '', null, 'low', '健康'),
				];
			})()
		},
		{
			labelKey: 'relaxed',
			tasks: (() => {
				seq = 0;
				return [
					mt('友人への返信', 'LINEの未読が溜まっている', '2026-05-10T00:00:00.000Z', 'medium', '連絡'),
					mt('洗濯', '', '2026-05-13T00:00:00.000Z', 'medium', '家事'),
					mt('部屋の掃除', '', '2026-05-15T00:00:00.000Z', 'low', '家事'),
					mt('歯医者の予約', '', '2026-05-23T00:00:00.000Z', 'medium', '健康'),
					mt('映像アート論 課題提出', '期末課題。まだ時間がある', '2026-06-03T00:00:00.000Z', 'high', '大学'),
					mt('積みゲー消化', '', null, 'low', 'エンタメ'),
				];
			})()
		}
	];

	function loadPreset(tasks: ReturnType<typeof mt>[]) {
		jsonText = JSON.stringify(tasks, null, 2);
		applyError = '';
	}

	// 現在の言語ファイルが存在するか
	const hasCurrentLangFile = $derived(!!get(langFiles)[$currentLocale]);
</script>

<div
	class="rel w:full h:full r:full flex ai:center jc:center bg:base-5 overflow:hidden"
	aria-label="settings"
	bind:this={pageEl}
>
	<!-- 通常設定: 言語選択 + 設定テキスト -->
	<div class="flex flex:column ai:center gap:14px" style="max-width: 200px;">
		<!-- 設定テキスト (3タップで隠し設定を開く) -->
		<span
			class="f:2rem font-weight:600 fg:base-2 cursor:default user-select:none"
			role="button"
			tabindex="0"
			onclick={handleTap}
			onkeydown={() => {}}
		>
			{s.settings}
		</span>

		<!-- 言語ピッカー -->
		<div class="flex flex:column ai:center gap:6px">
			<span class="f:0.6rem fg:base-3 user-select:none letter-spacing:0.08em" style="text-transform:uppercase;">
				{s.language}
			</span>
			<div class="flex flex:wrap jc:center gap:4px" style="max-width: 180px;">
				{#each LOCALES as loc, i (i)}
					<button
						class="f:0.65rem font-weight:700 cursor:pointer px:7px py:3px r:99px user-select:none"
						style="
							background: {$currentLocale === loc.code ? '#e0e0e0' : '#2a2a2a'};
							color: {$currentLocale === loc.code ? '#111' : '#888'};
							border: 1px solid {$currentLocale === loc.code ? '#e0e0e0' : '#3a3a3a'};
							transition: background 0.15s, color 0.15s;
						"
						onclick={() => setLocale(loc.code)}
					>
						{loc.shortLabel}
					</button>
				{/each}
			</div>
		</div>

		<!-- Google Tasks 連携 -->
		<div class="flex flex:column ai:center gap:6px" style="margin-top: 4px;">
			<span class="f:0.6rem fg:base-3 user-select:none letter-spacing:0.08em" style="text-transform:uppercase;">
				Google Tasks
			</span>
			{#if isAuthenticated}
				<div class="flex flex:column ai:center gap:5px">
					<div class="flex ai:center gap:5px">
						<span class="w:6px h:6px r:full" style="background: #4ECDC4; flex-shrink:0;"></span>
						<span class="f:0.65rem" style="color: #4ECDC4;">連携中</span>
					</div>
					<div class="flex gap:4px">
						<button
							class="f:0.65rem font-weight:600 cursor:pointer px:9px py:3px r:99px"
							style="background: #1a2a2a; border: 1px solid #2a4a4a; color: #4ECDC4;"
							onclick={handleSync}
						>
							同期
						</button>
						<a
							href={resolve("/auth/logout")}
							class="f:0.65rem font-weight:600 px:9px py:3px r:99px"
							style="background: #2a1a1a; border: 1px solid #4a2a2a; color: #cc5555; text-decoration:none; display:flex; align-items:center;"
						>
							解除
						</a>
					</div>
				</div>
			{:else}
				<a
					href={resolve("/auth/login")}
					class="f:0.65rem font-weight:700 px:12px py:4px r:99px"
					style="background: #1a1a2a; border: 1px solid #3a3a6a; color: #8888ee; text-decoration:none;"
				>
					Google でログイン
				</a>
			{/if}
		</div>
	</div>

	<!-- 隠し設定エディタ -->
	{#if showEditor}
		<div class="abs inset:0 r:full overflow:hidden flex ai:center jc:center" style="background: rgba(10,10,10,0.96); z-index: 50;">
			<div class="flex flex:column ai:center gap:10px" style="width: 480px;">

				<!-- ヘッダー: タブ + 閉じるボタン -->
				<div class="flex w:full ai:center jc:space-between px:8px">
					<div class="flex gap:6px">
						<button
							class="f:0.85rem font-weight:700 cursor:pointer px:12px py:5px r:6px"
							style="
								background: {editorTab === 'tasks' ? '#3a3a3a' : 'transparent'};
								color: {editorTab === 'tasks' ? '#f0f0f0' : '#666'};
								border: 1px solid {editorTab === 'tasks' ? '#555' : '#2a2a2a'};
							"
							onclick={() => { editorTab = 'tasks'; }}
						>
							{s.taskJson}
						</button>
						<button
							class="f:0.85rem font-weight:700 cursor:pointer px:12px py:5px r:6px"
							style="
								background: {editorTab === 'lang' ? '#3a3a3a' : 'transparent'};
								color: {editorTab === 'lang' ? '#f0f0f0' : '#666'};
								border: 1px solid {editorTab === 'lang' ? '#555' : '#2a2a2a'};
							"
							onclick={() => { editorTab = 'lang'; }}
						>
							{s.langFiles}
						</button>
					</div>
					<button
						class="f:0.8rem fg:base-3 bg:transparent b:none cursor:pointer px:8px py:4px r:6px"
						style="border: 1px solid #333;"
						onclick={() => { showEditor = false; applyError = ''; langFileSaveMsg = ''; }}
					>
						{s.close}
					</button>
				</div>

				<!-- タスク JSON タブ -->
				{#if editorTab === 'tasks'}
					<div class="flex gap:8px flex:wrap jc:center">
						{#each presets as preset, i (i)}
							<button
								class="f:0.75rem font-weight:600 fg:base-2 cursor:pointer px:12px py:6px r:99px"
								style="background: #2a2a2a; border: 1px solid #3a3a3a;"
								onclick={() => loadPreset(preset.tasks)}
							>
								{s[preset.labelKey] as string}
							</button>
						{/each}
						<!-- 現在の言語ファイルがあれば読み込みボタンを表示 -->
						{#if $langFiles[$currentLocale]}
							<button
								class="f:0.75rem font-weight:600 cursor:pointer px:12px py:6px r:99px"
								style="background: #1a2a1a; border: 1px solid #2a4a2a; color: #6dcf6d;"
								onclick={loadLangFileIntoEditor}
							>
								{LOCALES.find(l => l.code === $currentLocale)?.shortLabel} ↑
							</button>
						{/if}
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
						{s.apply}
					</button>

				<!-- 言語ファイル タブ -->
				{:else}
					<!-- 言語選択 -->
					<div class="flex flex:wrap gap:5px jc:center" style="max-width: 400px;">
						{#each LOCALES as loc, i (i)}
							<button
								class="f:0.75rem font-weight:700 cursor:pointer px:10px py:5px r:99px"
								style="
									background: {langFileLocale === loc.code ? '#2a3a2a' : '#2a2a2a'};
									color: {langFileLocale === loc.code ? '#6dcf6d' : '#888'};
									border: 1px solid {langFileLocale === loc.code ? '#3a5a3a' : '#3a3a3a'};
								"
								onclick={() => onLangFileLocaleChange(loc.code)}
							>
								{loc.shortLabel}
								{#if $langFiles[loc.code]}
									<span style="color: #4CAF50; margin-left: 2px;">●</span>
								{/if}
							</button>
						{/each}
					</div>

					<!-- 選択中の言語名 -->
					<span class="f:0.75rem" style="color: #666;">
						{LOCALES.find(l => l.code === langFileLocale)?.label ?? langFileLocale}
						{#if !$langFiles[langFileLocale]}
							— <span style="color: #555;">{s.noLangFile}</span>
						{/if}
					</span>

					<textarea
						bind:value={langFileText}
						spellcheck="false"
						placeholder={s.noLangFile}
						style="
							width: 480px;
							height: 230px;
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

					<div class="flex ai:center gap:12px">
						<button
							class="f:0.9rem font-weight:700 fg:base-1 cursor:pointer px:32px py:12px r:99px"
							style="background: #1a2a1a; border: 1px solid #3a5a3a; width: 180px;"
							onclick={saveLangFile}
						>
							{s.save}
						</button>
						{#if langFileSaveMsg}
							<span class="f:0.75rem" style="color: #4CAF50;">{langFileSaveMsg}</span>
						{/if}
					</div>
				{/if}

			</div>
		</div>
	{/if}
</div>
