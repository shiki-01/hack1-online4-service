<script lang="ts">
	import { countColor } from "$lib/localTasks";
	import { currentLocale } from '$lib/languageStore';
	import { t } from '$lib/i18n';

    let { length, isChangeColor = true }: { length: number; isChangeColor?: boolean } = $props();
	const ui = $derived(t($currentLocale));
</script>

<div class="abs left:50% bottom:20px z:10 translateX(-50%) flex flex:column ai:center line-h:1">
	<span class="f:8rem font-weight:700 fg:{isChangeColor ? countColor(length) : 'white'} line-h:1">{length}</span>
	<span class="f:2.4rem font-weight:700 fg:base-2 ls:0.1em mt:4px">{ui.tasks}</span>
</div>
