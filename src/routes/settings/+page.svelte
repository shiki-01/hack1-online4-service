<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.document.body.className = 'bg:background';
		}
	});
</script>

<div class="rel w:full h:full r:full flex ai:center jc:center bg:base-5 overflow:hidden" aria-label="settings">
	<span class="f:2rem font-weight:600 fg:base-2">設定</span>
</div>
