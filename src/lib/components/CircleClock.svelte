<script lang="ts">
	import { pomodoroPhase, pomodoroTimeDisplay } from '$lib/pomodoroStore';

	const now = new Date();
	const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 (${'日月火水木金土'[now.getDay()]})`;
	const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
</script>

<div
	class="abs left:50% top:50% z:10 pointer-events:none flex flex:column ai:center jc:center translate(-50%,-50%) w:770px square"
>
	<svg viewBox="0 0 100 100" class="rotate(-90deg)">
		<path
			id="arcPath"
			d="M 10 50 A 40 40 0 1 1 90 50 A 40 40 0 1 1 10 50"
			fill="transparent"
			stroke="none"
		/>

		<text font-size="4" style="fill: var(--base_2)">
			<textPath
				href="#arcPath"
				class="font-weight:700"
				startOffset="50%"
				textLength="34"
				text-anchor="middle"
			>
				{dateStr}
				{timeStr}
			</textPath>
		</text>

		{#if $pomodoroPhase !== 'idle'}
			<text font-size="4" font-weight="700">
				<textPath
					href="#arcPath"
					startOffset="75%"
					text-anchor="middle"
					style="fill: {$pomodoroPhase === 'work' ? 'var(--orange_1)' : 'var(--blue_1)'}"
				>
					{$pomodoroTimeDisplay}
				</textPath>
			</text>
		{/if}
	</svg>
</div>
