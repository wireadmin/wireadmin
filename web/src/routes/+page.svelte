<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import BasePage from '$lib/components/page/BasePage.svelte';
  import type { PageData } from './$types';
  import CreateServerDialog from './CreateServerDialog.svelte';
  import Server from './Server.svelte';
  import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
  import fetchAction from '$lib/fetch-action';

  export let data: PageData;
  export let isOpen = false;

  const handleRename = async (id: string, name: string) => {
    const resp = await fetchAction({
      action: '?/rename',
      method: 'POST',
      form: { id, name },
    });
    if (resp.statusText !== 'OK') {
      console.error('err: failed to rename server');
      return;
    }
    data.servers = data.servers.map((server) => {
      if (server.id === id) {
        server.name = name;
      }
      return server;
    });
  };
</script>

<BasePage showLogout={true}>
  <div class={'flex items-center justify-between py-3 px-2'}>
    <h2 class={'font-bold text-xl'}>Hello there 👋</h2>
    <Button on:click={() => (isOpen = true)}>
      <i class="fas fa-plus mr-2"></i>
      Create Server
    </Button>
  </div>

  <div class="space-y-3.5">
    {#if data.servers?.length < 1}
      <Card>No Servers Found</Card>
    {:else}
      <Card>
        <CardHeader>
          <CardTitle>Servers</CardTitle>
        </CardHeader>
        {#each data.servers as server}
          <Server
            {server}
            on:rename={({ detail }) => {
              handleRename(server.id.toString(), detail);
            }}
          />
        {/each}
      </Card>
    {/if}
  </div>
</BasePage>

<CreateServerDialog {isOpen} />
