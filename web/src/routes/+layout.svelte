<script lang="ts">
  import '../app.css';
  import { Toaster } from 'svelte-french-toast';
  import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher defaultMode="system" />
<slot />
<Toaster />
