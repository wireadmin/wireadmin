<script lang="ts">
  import { Dialog, DialogContent } from '$lib/components/ui/dialog';

  export let serverId: string;
  export let open: boolean = false;
</script>

<Dialog {open}>
  <DialogContent>
    <h2>Create Peer</h2>
    <p>Server Id: {serverId}</p>
  </DialogContent>
</Dialog>
