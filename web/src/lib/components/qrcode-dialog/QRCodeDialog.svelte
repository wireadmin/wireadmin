<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '$lib/components/ui/dialog';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { Button } from '$lib/components/ui/button';
  import type { SafeReturn } from '$lib/typings';

  const DialogClose = DialogPrimitive.Close;

  let loading: boolean = true;
  let error: boolean = false;
  let imageData: string | undefined = undefined;

  export let content: string | undefined;

  const getImageData = async (content: string): Promise<SafeReturn<string>> => {
    const resp = await fetch('/api/qrcode', {
      method: 'POST',
      body: content,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    if (resp.statusText !== 'OK') {
      return { error: new Error('request failed') };
    }
    const data = await resp.text();
    return { data };
  };

  $: if (typeof content === 'string') {
    (async () => {
      const { data, error: e } = await getImageData(content);
      loading = false;
      if (!data || e) {
        error = true;
        return;
      }
      imageData = data;
    })();
  }
</script>

<Dialog>
  <DialogTrigger asChild let:builder>
    <slot {builder} />
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>QRCode</DialogTitle>
    </DialogHeader>
    <div class="flex items-center justify-center">
      {#if loading}
        <Skeleton class="w-[280px] h-[280px] rounded-lg" />
      {:else if error || !imageData}
        <div>!!ERROR!!</div>
      {:else}
        <img src={imageData} alt="QRCode" width="300" height="300" />
      {/if}
    </div>
    <DialogFooter>
      <DialogClose>
        <Button size="sm">Close</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
