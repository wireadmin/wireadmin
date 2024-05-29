<script lang="ts">
  import type { Peer, WgServer } from '$lib/typings';
  import { CopiableText } from '$lib/components/copiable-text';
  import { EditableText } from '$lib/components/editable-text';
  import { NameSchema } from '$lib/wireguard/schema';
  import PeerActionButton from './PeerActionButton.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { getPeerConf } from '$lib/wireguard/utils';
  import { QRCodeDialog } from '$lib/components/qrcode-dialog';
  import { cn } from '$lib/utils';
  import { DownloadIcon, QrCodeIcon, Trash2Icon, UserIcon } from 'lucide-svelte';

  export let peer: Peer;
  export let server: WgServer;

  export let conf: string | undefined = undefined;

  let isLoading: boolean = false;

  onMount(async () => {
    conf = await getPeerConf({
      ...peer,
      serverPublicKey: server.publicKey,
      port: server.listen,
      dns: server.dns,
    });
  });

  const dispatch = createEventDispatcher();

  const handleDownload = () => {
    if (!conf) {
      console.error('conf is null');
      return;
    }
    // create a blob
    const blob = new Blob([conf], { type: 'text/plain' });
    // create a link
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${peer.name}.conf`;
    // click the link
    link.click();
    // remove the link
    link.remove();
  };

  const handleRename = (value: string) => {
    dispatch('rename', value);
  };

  const handleRemove = () => {
    dispatch('remove');
  };
</script>

<div
  class={cn(
    'flex items-center justify-between p-4 rounded-md',
    'border border-input bg-background hover:bg-accent/30 hover:text-accent-foreground'
  )}
>
  <div class="flex items-center gap-x-2">
    <div
      class={'w-12 h-12 flex items-center justify-center mr-4 rounded-full bg-gray-200 max-md:hidden'}
    >
      <UserIcon class="text-gray-400 text-lg" />
    </div>

    <div class="h-full flex flex-col justify-between col-span-4 gap-y-1.5">
      <EditableText
        rootClass={'font-medium col-span-4'}
        inputClass={'w-20'}
        schema={NameSchema}
        value={peer.name}
        on:change={({ detail }) => {
          handleRename(detail.value);
        }}
      />
      <CopiableText value={peer.allowedIps} class={'text-sm'} showInHover={true}>
        <span class={'font-mono text-gray-400 text-xs'}> {peer.allowedIps} </span>
      </CopiableText>
    </div>
  </div>
  <div class="flex items-center justify-center gap-x-3">
    <!-- QRCode -->
    <QRCodeDialog let:builder content={conf}>
      <PeerActionButton builders={[builder]} disabled={isLoading}>
        <QrCodeIcon class="w-4 h-4" />
      </PeerActionButton>
    </QRCodeDialog>

    <!-- Download -->
    <PeerActionButton disabled={isLoading} on:click={handleDownload}>
      <DownloadIcon class="w-4 h-4" />
    </PeerActionButton>

    <!-- Remove -->
    <PeerActionButton loading={isLoading} on:click={handleRemove}>
      <Trash2Icon class="w-4 h-4" />
    </PeerActionButton>
  </div>
</div>
