<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { pendingTasks, bubbleRadius } from '$lib/localTasks';
	import gsap from 'gsap';
	import CircleClock from '$lib/components/CircleClock.svelte';

	const colorPairs: [string, string][] = [
		['#D94F45', '#B83D34'],
		['#E07A3A', '#C06828'],
		['#4BBFB5', '#36A89E']
	];

	type StaticBubble = {
		cx: number;
		cy: number;
		r: number;
		pair: [string, string];
		angle: number;
	};

	const staticBubbles: StaticBubble[] = [
		{ cx: 34, cy: 22, r: 11, pair: colorPairs[0], angle: 130 },
		{ cx: 58, cy: 18, r: 8, pair: colorPairs[1], angle: 50 },
		{ cx: 76, cy: 26, r: 9, pair: colorPairs[1], angle: 200 },
		{ cx: 18, cy: 40, r: 8, pair: colorPairs[2], angle: 80 },
		{ cx: 46, cy: 38, r: 13, pair: colorPairs[0], angle: 160 },
		{ cx: 74, cy: 44, r: 8, pair: colorPairs[2], angle: 310 },
		{ cx: 28, cy: 58, r: 9, pair: colorPairs[1], angle: 240 },
		{ cx: 50, cy: 56, r: 10, pair: colorPairs[2], angle: 20 },
		{ cx: 72, cy: 60, r: 10, pair: colorPairs[0], angle: 100 },
		{ cx: 20, cy: 76, r: 8, pair: colorPairs[0], angle: 270 },
		{ cx: 42, cy: 78, r: 12, pair: colorPairs[1], angle: 45 },
		{ cx: 66, cy: 76, r: 9, pair: colorPairs[2], angle: 140 },
		{ cx: 34, cy: 90, r: 7, pair: colorPairs[2], angle: 190 },
		{ cx: 56, cy: 88, r: 8, pair: colorPairs[0], angle: 70 }
	];

	const CONTAINER_R = 280;
	const GRAVITY = 0.18;
	const FRICTION = 0.985;
	const RESTITUTION = 0.15;
	const RESOLVE_ITERS = 4;
	const GAP = 10;

	interface Bubble {
		x: number;
		y: number;
		vx: number;
		vy: number;
		r: number;
		angle: number;
		colorA: string;
		colorB: string;
		label: string;
	}

	let canvas: HTMLCanvasElement | null = null;
	let bubbles: Bubble[] = [];
	let tickerCallback: (() => void) | null = null;

	onMount(() => {
		if (!canvas) return;

		const tasks = get(pendingTasks);

		const SIZE = 560;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = SIZE * dpr;
		canvas.height = SIZE * dpr;
		canvas.style.width = `${SIZE}px`;
		canvas.style.height = `${SIZE}px`;

		const ctx = canvas.getContext('2d')!;
		ctx.scale(dpr, dpr);

		const CX = SIZE / 2;
		const CY = SIZE / 2;

		const scale = (CONTAINER_R * 2) / 100;

		function pickStatic(i: number): StaticBubble {
			return staticBubbles[i % staticBubbles.length];
		}

		bubbles = tasks.map((task, i) => {
			const sb = pickStatic(i);

			const x = (sb.cx - 50) * scale;
			const y = (sb.cy - 50) * scale;

			return {
				x,
				y,
				vx: (Math.random() - 0.5) * 2,
				vy: (Math.random() - 0.5) * 2,
				r: bubbleRadius(task.dueDate),
				angle: sb.angle,
				colorA: sb.pair[0],
				colorB: sb.pair[1],
				label: task.title.slice(0, 5)
			};
		});

		function physicsTick() {
			for (const b of bubbles) {
				b.vy += GRAVITY;
				b.vx *= FRICTION;
				b.vy *= FRICTION;
				b.x += b.vx;
				b.y += b.vy;
			}

			for (let iter = 0; iter < RESOLVE_ITERS; iter++) {
				for (let i = 0; i < bubbles.length; i++) {
					for (let j = i + 1; j < bubbles.length; j++) {
						const bi = bubbles[i];
						const bj = bubbles[j];
						const dx = bj.x - bi.x;
						const dy = bj.y - bi.y;
						const dist = Math.hypot(dx, dy);
						const minDist = bi.r + bj.r + 1.5 + GAP;
						if (dist < minDist && dist > 0.01) {
							const nx = dx / dist;
							const ny = dy / dist;
							const push = (minDist - dist) * 0.5;
							bi.x -= nx * push;
							bi.y -= ny * push;
							bj.x += nx * push;
							bj.y += ny * push;

							const rv = (bj.vx - bi.vx) * nx + (bj.vy - bi.vy) * ny;
							if (rv < 0) {
								const imp = rv * (1 + RESTITUTION) * 0.5;
								bi.vx += imp * nx;
								bi.vy += imp * ny;
								bj.vx -= imp * nx;
								bj.vy -= imp * ny;
							}
						}
					}
				}
			}

			for (const b of bubbles) {
				const dist = Math.hypot(b.x, b.y);
				const maxDist = CONTAINER_R - b.r;
				if (dist > maxDist && dist > 0.01) {
					const nx = b.x / dist;
					const ny = b.y / dist;
					b.x = nx * maxDist;
					b.y = ny * maxDist;
					const dot = b.vx * nx + b.vy * ny;
					if (dot > 0) {
						b.vx -= dot * nx * (1 + RESTITUTION);
						b.vy -= dot * ny * (1 + RESTITUTION);
					}
				}
			}
		}

		function drawHalfBubble(
			ctx: CanvasRenderingContext2D,
			x: number,
			y: number,
			r: number,
			angleDeg: number,
			colorA: string,
			colorB: string
		) {
			const a = (angleDeg * Math.PI) / 180;
			const x1 = x + r * Math.cos(a);
			const y1 = y + r * Math.sin(a);
			const _x2 = x - r * Math.cos(a);
			const _y2 = y - r * Math.sin(a);

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.arc(x, y, r, a, a + Math.PI, false);
			ctx.closePath();
			ctx.fillStyle = colorA;
			ctx.fill();

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.arc(x, y, r, a, a - Math.PI, true);
			ctx.closePath();
			ctx.fillStyle = colorB;
			ctx.fill();
		}

		function draw() {
			ctx.clearRect(0, 0, SIZE, SIZE);
			for (const b of bubbles) {
				const x = b.x + CX;
				const y = b.y + CY;

				drawHalfBubble(ctx, x, y, b.r, b.angle, b.colorA, b.colorB);

				if (b.r >= 32) {
					ctx.fillStyle = 'rgba(255,255,255,0.9)';
					const fontSize = Math.max(9, Math.min(14, b.r * 0.28));
					ctx.font = `600 ${fontSize}px Inter, sans-serif`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					//ctx.fillText(b.label, x, y);
				}
			}
		}

		tickerCallback = () => {
			physicsTick();
			draw();
		};
		gsap.ticker.add(tickerCallback);

		return () => {
			if (tickerCallback) gsap.ticker.remove(tickerCallback);
		};
	});
</script>

<div class="abs inset:0 flex ai:center jc:center">
	<canvas bind:this={canvas} class="w:full h:full r:50% bg:#2F2F2F"></canvas>

	<CircleClock />

	<div class="abs left:50% bottom:20px z:10 pointer-events:none flex flex:column ai:center jc:center translateX(-50%)">
		<span class="f:6rem font-weight:700 fg:#F7F7F7 line-h:1">{$pendingTasks.length}</span>
		<span class="f:1.6rem font-weight:700 fg:#797979 text-transform:uppercase ls:0.1em">Tasks</span>
	</div>
</div>
