<script lang="ts">
	import { pomodoroPhase, pomodoroTimeDisplay } from '$lib/pomodoroStore';
	import { currentLocale } from '$lib/languageStore';
	import { t } from '$lib/i18n';

	const now = new Date();
	const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	const dateStr = $derived(t($currentLocale).formatArcDate(now));

	let { isPomodoro = false }: { isPomodoro?: boolean } = $props();
</script>

<div
	class="abs left:50% top:50% z:10 pointer-events:none flex flex:column ai:center jc:center translate(-50%,-50%) w:770px square"
>
	<svg viewBox="0 0 100 100" class="rotate({$pomodoroPhase !== 'idle' && !isPomodoro ? '-105' : '-90'}deg)">
		<path
			id="arcPath"
			d="M 10 50 A 40 40 0 1 1 90 50 A 40 40 0 1 1 10 50"
			fill="transparent"
			stroke="none"
		/>

		<text font-size="4" class="fill:base-2">
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

		{#if $pomodoroPhase !== 'idle' && !isPomodoro}
			<text font-size="4" font-weight="700" class="fill:{$pomodoroPhase === 'work' ? 'orange-1' : 'blue-1'}">
				<textPath
					href="#arcPath"
					startOffset="62%"
					text-anchor="middle"
				>
					{$pomodoroTimeDisplay}
				</textPath>
			</text>
		{/if}
	</svg>
</div>
