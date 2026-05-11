<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import QRCode from 'qrcode';

	type Status = 'loading' | 'ready' | 'authenticated' | 'expired' | 'error';

	let status = $state<Status>('loading');
	let pendingId = $state('');
	let pollInterval = $state(3);
	let canvasEl = $state<HTMLCanvasElement | undefined>();
	let pollTimer: ReturnType<typeof setInterval> | undefined;

	async function startFlow() {
		status = 'loading';
		pendingId = '';
		stopPolling();

		try {
			const res = await fetch('/api/auth/device/start');
			if (!res.ok) throw new Error();
			const data: { pendingId: string; connectUrl: string; interval: number } = await res.json();

			pendingId = data.pendingId;
			pollInterval = data.interval;

			await QRCode.toCanvas(canvasEl!, data.connectUrl, {
				width: 220,
				margin: 2,
				color: { dark: '#111111', light: '#f0f0f0' }
			});

			status = 'ready';
			startPolling();
		} catch {
			status = 'error';
		}
	}

	function startPolling() {
		stopPolling();
		pollTimer = setInterval(async () => {
			try {
				const res = await fetch(`/api/auth/device/poll?id=${pendingId}`);
				if (!res.ok) return;
				const data: { status: string } = await res.json();

				if (data.status === 'authenticated') {
					stopPolling();
					status = 'authenticated';
					await goto(resolve(`/auth/qr-complete?id=${pendingId}`));
				} else if (data.status === 'expired') {
					stopPolling();
					status = 'expired';
				}
			} catch {
				// ネットワークエラーは無視
			}
		}, pollInterval * 1000);
	}

	function stopPolling() {
		if (pollTimer !== undefined) {
			clearInterval(pollTimer);
			pollTimer = undefined;
		}
	}

	onMount(() => { startFlow(); });
	onDestroy(() => { stopPolling(); });
</script>

<div
	class="rel w:full h:full r:full flex flex:column ai:center jc:center bg:base-5 overflow:hidden"
	aria-label="qr-login"
>
	<!-- 戻るボタン -->
	<button
		class="abs cursor:pointer"
		style="top: 175px; left: 50%; transform: translateX(-50%); background: transparent; border: none; color: #555; font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase;"
		onclick={() => goto(resolve('/settings'))}
	>
		← 戻る
	</button>

	<span
		class="f:0.6rem fg:base-3 user-select:none letter-spacing:0.08em"
		style="text-transform:uppercase; margin-bottom: 14px;"
	>
		Google Login
	</span>

	<div
		style="
			width: 228px;
			height: 228px;
			border-radius: 16px;
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #f0f0f0;
			position: relative;
			flex-shrink: 0;
		"
	>
		<canvas bind:this={canvasEl} style="display: block;"></canvas>

		{#if status === 'loading'}
			<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#1a1a1a;border-radius:16px;">
				<span style="color:#555;font-size:0.7rem;">読み込み中…</span>
			</div>
		{:else if status === 'authenticated'}
			<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a1a0a;border-radius:16px;gap:8px;">
				<span style="font-size:2rem;">✅</span>
				<span style="color:#4ECDC4;font-size:0.7rem;">認証完了</span>
			</div>
		{:else if status === 'expired' || status === 'error'}
			<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a1a;border-radius:16px;gap:10px;">
				<span style="color:#888;font-size:0.7rem;">{status === 'expired' ? '期限切れ' : 'エラー'}</span>
				<button
					style="background:#2a2a2a;border:1px solid #3a3a3a;color:#ccc;border-radius:99px;padding:5px 14px;font-size:0.65rem;cursor:pointer;"
					onclick={startFlow}
				>
					再生成
				</button>
			</div>
		{/if}
	</div>

	{#if status === 'ready'}
		<span style="color:#444;font-size:0.58rem;margin-top:12px;text-align:center;line-height:1.7;">
			スマホで QR を読み取り<br>Google アカウントでログイン
		</span>
	{/if}
</div>
