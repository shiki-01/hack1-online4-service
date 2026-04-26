<script lang="ts">
	import {
		physicsRotation,
		modeSwitchEnabled,
		pushRotation,
		pushClick,
		toggleModeSwitch
	} from '$lib/physicsController';

	interface Props {
		/**
		 * true のとき、ボタンクリックで modeSwitchEnabled を toggle しない (サブページ用)
		 */
		disableToggle?: boolean;
	}
	let { disableToggle = false }: Props = $props();

	// ---- Knob drag (vertical drag = DAW style) ----
	let isDragging = $state(false);
	let lastY = 0;
	/** ピクセルあたりの回転角度 (度) — 小さいほど回しやすくなる */
	const SENSITIVITY = 0.8;

	function onKnobPointerDown(e: PointerEvent) {
		isDragging = true;
		lastY = e.clientY;
		(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
	}

	function onKnobPointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const dy = lastY - e.clientY; // 上 = 正 = 時計回り
		lastY = e.clientY;
		pushRotation(dy * SENSITIVITY);
	}

	function onKnobPointerUp() {
		isDragging = false;
	}

	// ---- Button: push button (fires click, no persistent toggle visual) ----
	let isPressed = $state(false);

	function onButtonPointerDown() {
		isPressed = true;
	}

	function onButtonClick() {
		if (!disableToggle) toggleModeSwitch();
		pushClick();
	}

	function onButtonPointerUp() {
		isPressed = false;
	}

	// ---- Knob visual ----
	const indicatorAngle = $derived(((($physicsRotation % 360) + 360) % 360));
</script>

<!-- position: fixed で 720×720 サークルの外側・下方に配置 -->
<div class="physics-controls" aria-label="physics controls">
	<!-- Knob -->
	<div
		class="knob"
		class:dragging={isDragging}
		role="slider"
		aria-label="回転ノブ"
		aria-valuenow={Math.round($physicsRotation)}
		tabindex="0"
		onpointerdown={onKnobPointerDown}
		onpointermove={onKnobPointerMove}
		onpointerup={onKnobPointerUp}
		onpointercancel={onKnobPointerUp}
	>
		<div class="knob-ring">
			<div class="knob-dial" style="transform: rotate({indicatorAngle}deg);">
				<div class="knob-indicator"></div>
			</div>
		</div>
		<div class="knob-label">CTRL</div>
	</div>

	<!-- Button: push type -->
	<button
		class="phy-btn"
		class:pressed={isPressed}
		onclick={onButtonClick}
		onpointerdown={onButtonPointerDown}
		onpointerup={onButtonPointerUp}
		onpointerleave={onButtonPointerUp}
		aria-label="フィジクスボタン"
	>
		<div class="phy-btn-dot"></div>
	</button>
</div>

<style>
	.physics-controls {
		position: fixed;
		/* 720px サークルの真下 12px */
		top: calc(50vh + 360px + 12px);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 24px;
		z-index: 200;
		pointer-events: auto;
	}

	/* ---- Knob ---- */
	.knob {
		position: relative;
		width: 56px;
		height: 62px;
		cursor: ns-resize;
		user-select: none;
		touch-action: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.knob.dragging {
		cursor: grabbing;
	}

	.knob-ring {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #3a3a3a, #1a1a1a);
		border: 2px solid #444;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.6),
			inset 0 1px 2px rgba(255, 255, 255, 0.06);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color 0.15s;
	}

	.knob:focus-visible .knob-ring,
	.knob.dragging .knob-ring {
		border-color: #666;
		box-shadow:
			0 2px 12px rgba(0, 0, 0, 0.7),
			inset 0 1px 2px rgba(255, 255, 255, 0.08),
			0 0 0 2px rgba(255, 255, 255, 0.1);
	}

	.knob-dial {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: radial-gradient(circle at 40% 40%, #2e2e2e, #161616);
		position: relative;
	}

	.knob-indicator {
		position: absolute;
		top: 4px;
		left: 50%;
		transform: translateX(-50%);
		width: 3px;
		height: 10px;
		background: #b0b0b0;
		border-radius: 2px;
	}

	.knob-label {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #555;
		text-transform: uppercase;
	}

	/* ---- Button (push type) ---- */
	.phy-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid #3a3a3a;
		background: radial-gradient(circle at 35% 35%, #333, #1a1a1a);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.08s,
			background 0.08s,
			box-shadow 0.08s;
		box-shadow:
			0 3px 6px rgba(0, 0, 0, 0.5),
			inset 0 1px 1px rgba(255, 255, 255, 0.06);
	}

	.phy-btn:hover {
		border-color: #555;
	}

	.phy-btn.pressed,
	.phy-btn:active {
		transform: scale(0.88) translateY(1px);
		background: radial-gradient(circle at 35% 35%, #222, #141414);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.5),
			inset 0 1px 3px rgba(0, 0, 0, 0.4);
	}

	.phy-btn-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #4a4a4a;
	}

	.phy-btn.pressed .phy-btn-dot,
	.phy-btn:active .phy-btn-dot {
		background: #888;
	}
</style>
