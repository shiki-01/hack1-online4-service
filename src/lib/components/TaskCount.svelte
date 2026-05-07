<script lang="ts">
	import { countColor } from "$lib/localTasks";

    let { length, isChangeColor = true }: { length: number; isChangeColor?: boolean } = $props();
</script>

<div class="abs left:50% bottom:20px z:10 translateX(-50%) flex flex:column ai:center line-h:1">
	<span class="f:8rem font-weight:700 fg:{isChangeColor ? countColor(length) : 'white'} line-h:1">{length}</span>
	<span class="f:2.4rem font-weight:700 fg:base-2 ls:0.1em mt:4px">Tasks</span>
</div>
