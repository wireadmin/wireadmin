<script lang="ts">
  import type { PageData } from './$types';
  import CreatePeerDialog from './CreatePeerDialog.svelte';
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import Peer from './Peer.svelte';
  import fetchAction from '$lib/utils/fetch-action';
  import DetailRow from './DetailRow.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { CopiableText } from '$lib/components/copiable-text';
  import { MiddleEllipsis } from '$lib/components/middle-ellipsis';
  import { goto, invalidateAll } from '$app/navigation';
  import { Empty } from '$lib/components/empty';
  import prettyBytes from 'pretty-bytes';
  import { onDestroy } from 'svelte';
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from '$lib/components/ui/breadcrumb';
  import { ArrowUpIcon } from 'lucide-svelte';

  export let data: PageData;
  let dialogOpen = false;

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

  const handleChangeState = async (state: string) => {
    const resp = await fetchAction({
      action: '?/change-server-state',
      method: 'POST',
      form: { state },
    });
    if (resp.statusText !== 'OK') {
      console.error('error: failed to change server state.');
      return;
    }

    if (state === 'remove') {
      await goto('/');
      return;
    }

    await invalidateAll();
  };

  // revalidate every 2 seconds
  const interval = setInterval(() => {
    if (!dialogOpen) {
      invalidateAll();
    }
  }, 2000);

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="flex items-center gap-2 py-4 px-2 leading-none">
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{data.server.name}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</div>

<div class="space-y-3.5">
  <Card>
    <CardHeader>
      <CardTitle>Server</CardTitle>
    </CardHeader>

    <CardContent>
      <DetailRow label={'Mode'}>
        {#if data.server.tor}
          <Badge variant="tor">Tor</Badge>
        {:else}
          <Badge variant="default">Normal</Badge>
        {/if}
      </DetailRow>

      <DetailRow label={'IP address'}>
        <pre> {data.server.address}/24 </pre>
      </DetailRow>

      <DetailRow label={'Listen Port'}>
        <pre> {data.server.listen} </pre>
      </DetailRow>

      <DetailRow label={'Total Usage'}>
        <div class="flex items-center gap-3 text-sm">
          <div class="flex items-center gap-x-1.5">
            <ArrowUpIcon class="h-4 w-4 text-gray-500" />
            <span>{prettyBytes(data.usage.total.tx)}</span>
          </div>
          <div class="flex items-center gap-x-1.5">
            <ArrowUpIcon class="h-4 w-4 text-gray-500 rotate-180" />
            <span>{prettyBytes(data.usage.total.rx)}</span>
          </div>
        </div>
      </DetailRow>

      <DetailRow label={'Status'}>
        <Badge variant={data.server.status === 'up' ? 'success' : 'destructive'} />
      </DetailRow>

      <DetailRow label={'Public Key'}>
        <CopiableText value={data.server.publicKey}>
          <MiddleEllipsis content={data.server.publicKey} maxLength={10} />
        </CopiableText>
      </DetailRow>
    </CardContent>

    <CardFooter class="flex flex-wrap items-center gap-2">
      {#if data.server.status === 'up'}
        <Button
          variant="outline"
          class="max-md:w-full"
          size="sm"
          on:click={() => {
            handleChangeState('restart');
          }}
          >Restart
        </Button>
        <Button
          variant="destructive"
          class="max-md:w-full"
          size="sm"
          on:click={() => {
            handleChangeState('stop');
          }}
          >Stop
        </Button>
      {:else}
        <Button
          class="max-md:w-full"
          size="sm"
          on:click={() => {
            handleChangeState('start');
          }}
        >
          Start
        </Button>
        <Button
          variant="destructive"
          class="max-md:w-full"
          size="sm"
          on:click={() => {
            handleChangeState('remove');
          }}
        >
          Remove
        </Button>
      {/if}
    </CardFooter>
  </Card>

  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Clients</CardTitle>
    </CardHeader>
    {#if data.server.peers.length > 0}
      <CardContent class="space-y-3">
        {#each data.server.peers as peer}
          <Peer
            {peer}
            server={data.server}
            on:rename={({ detail }) => {
              handleRename(peer.id.toString(), detail);
            }}
            on:remove={() => {
              handleRemove(peer.id.toString());
            }}
          />
        {/each}
      </CardContent>
    {:else}
      <CardContent>
        <Empty description={'No Clients!'} />
      </CardContent>
    {/if}

    <CardFooter>
      <CreatePeerDialog data={data.form} let:builder bind:open={dialogOpen}>
        <Button size="sm" builders={[builder]}>Add Client</Button>
      </CreatePeerDialog>
    </CardFooter>
  </Card>
</div>
