<script lang="ts">
  import type { PageData } from './$types';
  import { Card } from '$lib/components/ui/card';
  import CreatePeerDialog from './CreatePeerDialog.svelte';
  import { CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button';
  import Peer from './Peer.svelte';
  import fetchAction from '$lib/fetch-action';

  export let data: PageData;
  export let dialogOpen: boolean = false;

  const handleRename = async (peerId: string, name: string) => {
    const resp = await fetchAction({
      action: '?/rename',
      method: 'POST',
      form: {
        id: peerId,
        name,
      },
    });
    if (resp.statusText !== 'OK') {
      console.error('err: failed to change peer name.');
      return;
    }
    data.server.peers = data.server.peers.map((peer) => {
      if (peer.id === peerId) {
        peer.name = name;
      }
      return peer;
    });
    console.info('peer name changed!');
  };

  const handleRemove = async (peerId: string) => {
    const form = new FormData();
    form.set('id', peerId);

    const resp = await fetchAction({
      action: '?/remove',
      method: 'POST',
      body: form,
    });
    if (resp.statusText !== 'OK') {
      console.error('err: failed to remove peer.');
      return;
    }
    data.server.peers = data.server.peers.filter((peer) => peer.id !== peerId);
  };
</script>

<CreatePeerDialog serverId={data.server.id} open={dialogOpen} />

<Card>Hello there!</Card>

<Card>
  <CardHeader class="flex flex-row items-center justify-between">
    <CardTitle>Clients</CardTitle>
    <span> </span>
  </CardHeader>
  <CardContent>
    {#each data.server.peers as peer}
      <Peer
        {peer}
        serverKey={data.server.publicKey}
        serverPort={data.server.listen}
        serverDNS={data.server.dns}
        on:rename={({ detail }) => {
          handleRename(peer.id.toString(), detail);
        }}
        on:remove={() => {
          handleRemove(peer.id.toString());
        }}
      />
    {/each}
  </CardContent>
  {#if data.server.peers.length > 0}
    <CardFooter>
      <Button class="btn btn-primary" on:click={() => (dialogOpen = true)}>Add Client</Button>
    </CardFooter>
  {/if}
</Card>
