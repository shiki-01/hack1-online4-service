<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.document.body.style.backgroundColor = 'var(--base_5)';
		}
	});
</script>

<div class="rel w:full h:full r:full bg:$(base_5) flex ai:center jc:center" aria-label="settings">
	<span class="f:2rem font-weight:600 fg:$(base_2)">設定</span>
</div>
