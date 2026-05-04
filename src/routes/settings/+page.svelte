<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.document.body.style.backgroundColor = '#2f2f2f';
		}
	});
</script>

<div class="rel w:full h:full r:full bg:#2f2f2f flex ai:center jc:center" aria-label="settings">
	<span class="f:2rem font-weight:600 fg:#797979">設定</span>
</div>
