<script lang="ts">
  import type { Peer } from '$lib/typings';
  import { CopiableText } from '$lib/components/copiable-text';
  import { EditableText } from '$lib/components/editable-text';
  import { NameSchema } from '$lib/wireguard/schema';
  import PeerActionButton from './PeerActionButton.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { getPeerConf } from '$lib/wireguard/utils';
  import { QRCodeDialog } from '$lib/components/qrcode-dialog';

  export let peer: Peer;

  export let serverKey: string;
  export let serverPort: number;
  export let serverDNS: string | null;

  export let conf: string | undefined = undefined;

  let isLoading: boolean = false;

  onMount(async () => {
    conf = await getPeerConf({
      ...peer,
      serverPublicKey: serverKey,
      port: serverPort,
      dns: serverDNS,
    });
  });

  const dispatch = createEventDispatcher();

  const handleDownload = () => {
    if (!conf) {
      console.error('conf is null');
      return;
    }
    console.log('conf', conf);
    // create a blob
    const blob = new Blob([ conf ], { type: 'text/plain' });
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

<div class="flex items-center justify-between p-4 border border-neutral-200/60 rounded-md hover:border-neutral-200">
  <div class="flex items-center gap-x-2">
    <div class={'w-12 aspect-square flex items-center justify-center mr-4 rounded-full bg-gray-200 max-md:hidden'}>
      <i class={'fas fa-user text-gray-400 text-lg'} />
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
        <i class={'fal text-neutral-700 group-hover:text-primary fa-qrcode'} />
      </PeerActionButton>
    </QRCodeDialog>

    <!-- Download -->
    <PeerActionButton disabled={isLoading} on:click={handleDownload}>
      <i class={'fal text-neutral-700 group-hover:text-primary fa-download'} />
    </PeerActionButton>

    <!-- Remove -->
    <PeerActionButton loading={isLoading} on:click={handleRemove}>
      <i class={'fal text-neutral-700 group-hover:text-primary text-lg fa-trash-can'} />
    </PeerActionButton>
  </div>
</div>
