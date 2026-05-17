<script lang="ts">
	let ssid = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let status = $state<'idle' | 'connecting' | 'success' | 'error'>('idle');
	let errorMsg = $state('');

	async function connect() {
		if (!ssid.trim()) return;
		status = 'connecting';
		errorMsg = '';
		try {
			const res = await fetch('/api/setup/wifi', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ssid: ssid.trim(), password })
			});
			const data = await res.json();
			if (data.success) {
				status = 'success';
			} else {
				errorMsg = data.error ?? 'エラーが発生しました';
				status = 'error';
			}
		} catch {
			errorMsg = 'デバイスへの接続に失敗しました';
			status = 'error';
		}
	}
</script>

<!-- position:fixed でルートの720×720円から脱出し、スマホ画面全体を覆う -->
<div style="
	position: fixed;
	inset: 0;
	background: #0d0d0d;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	font-family: system-ui, -apple-system, sans-serif;
">
	<div style="width: 100%; max-width: 360px;">

		{#if status === 'success'}
			<div style="text-align: center; padding: 40px 0;">
				<div style="font-size: 3rem; margin-bottom: 16px;">📡</div>
				<p style="color: #4ECDC4; font-size: 1rem; font-weight: 600; margin: 0 0 8px;">接続中…</p>
				<p style="color: #555; font-size: 0.8rem; margin: 0; line-height: 1.8;">
					デバイスが Wi-Fi への接続を試みています。<br>
					30 秒ほど待ってからデバイスの画面を確認してください。<br><br>
					<span style="color: #444; font-size: 0.72rem;">
						※ 接続が完了すると STACKS-Setup は切断されます
					</span>
				</p>
			</div>

		{:else}
			<p style="color: #888; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 24px; text-align: center;">
				STACKS Wi-Fi Setup
			</p>

			<div style="display: flex; flex-direction: column; gap: 12px;">
				<div>
					<label for="ssid" style="display: block; color: #666; font-size: 0.72rem; margin-bottom: 5px;">
						ネットワーク名 (SSID)
					</label>
					<input
						id="ssid"
						type="text"
						bind:value={ssid}
						placeholder="例: MyHomeWiFi"
						autocomplete="off"
						autocorrect="off"
						spellcheck="false"
						style="
							width: 100%;
							background: #1a1a1a;
							border: 1px solid #2a2a2a;
							color: #eee;
							border-radius: 10px;
							padding: 11px 14px;
							font-size: 0.9rem;
							outline: none;
							box-sizing: border-box;
						"
					/>
				</div>

				<div>
					<label for="pass" style="display: block; color: #666; font-size: 0.72rem; margin-bottom: 5px;">
						パスワード
					</label>
					<div style="position: relative;">
						<input
							id="pass"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="パスワード"
							autocomplete="off"
							style="
								width: 100%;
								background: #1a1a1a;
								border: 1px solid #2a2a2a;
								color: #eee;
								border-radius: 10px;
								padding: 11px 44px 11px 14px;
								font-size: 0.9rem;
								outline: none;
								box-sizing: border-box;
							"
						/>
						<button
							type="button"
							onclick={() => { showPassword = !showPassword; }}
							style="
								position: absolute;
								right: 12px;
								top: 50%;
								transform: translateY(-50%);
								background: none;
								border: none;
								color: #555;
								cursor: pointer;
								font-size: 0.75rem;
								padding: 4px;
							"
						>
							{showPassword ? '隠す' : '表示'}
						</button>
					</div>
				</div>

				{#if status === 'error'}
					<p style="color: #cc5555; font-size: 0.75rem; margin: 0;">{errorMsg}</p>
				{/if}

				<button
					onclick={connect}
					disabled={status === 'connecting' || !ssid.trim()}
					style="
						background: {status === 'connecting' ? '#1a1a2a' : '#3a3aaa'};
						color: {status === 'connecting' ? '#555' : '#eee'};
						border: none;
						border-radius: 10px;
						padding: 13px;
						font-size: 0.9rem;
						font-weight: 600;
						cursor: {status === 'connecting' ? 'default' : 'pointer'};
						margin-top: 4px;
						transition: background 0.2s;
					"
				>
					{status === 'connecting' ? '接続中…' : 'Wi-Fi に接続'}
				</button>
			</div>

			<p style="color: #333; font-size: 0.65rem; text-align: center; margin: 20px 0 0; line-height: 1.6;">
				STACKS ホットスポット (STACKS-Setup) 経由で接続中<br>
				設定完了後、デバイスは自動で再接続します
			</p>
		{/if}

	</div>
</div>
