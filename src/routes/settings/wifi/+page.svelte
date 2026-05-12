<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import QRCode from 'qrcode';

	let { data } = $props();

	let canvasEl = $state<HTMLCanvasElement | undefined>();
	let ready = $state(false);

	function escapeWifi(val: string): string {
		return val
			.replace(/\\/g, '\\\\')
			.replace(/;/g, '\\;')
			.replace(/,/g, '\\,')
			.replace(/"/g, '\\"')
			.replace(/:/g, '\\:');
	}

	onMount(async () => {
		if (!canvasEl) return;
		const wifiStr = `WIFI:T:WPA;S:${escapeWifi(data.apSsid)};P:${escapeWifi(data.apPassword)};;`;
		await QRCode.toCanvas(canvasEl, wifiStr, {
			width: 220,
			margin: 2,
			color: { dark: '#111111', light: '#f0f0f0' }
		});
		ready = true;
	});
</script>

<div
	class="rel w:full h:full r:full flex flex:column ai:center jc:center bg:base-5 overflow:hidden"
	aria-label="wifi-setup-qr"
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
		Wi-Fi Setup
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
		{#if !ready}
			<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#1a1a1a;border-radius:16px;">
				<span style="color:#555;font-size:0.7rem;">読み込み中…</span>
			</div>
		{/if}
	</div>

	{#if ready}
		<span style="color:#555;font-size:0.62rem;margin-top:14px;text-align:center;line-height:1.7;">
			{data.apSsid}
		</span>
		<span style="color:#444;font-size:0.58rem;margin-top:6px;text-align:center;line-height:1.8;">
			① QR を読み取り接続<br>
			② ブラウザで <span style="color:#7777cc;">192.168.4.1/setup</span> を開く
		</span>
	{/if}
</div>
