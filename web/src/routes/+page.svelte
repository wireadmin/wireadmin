<script lang="ts">
  import BasePage from '$lib/components/page/BasePage.svelte';
  import type { PageData } from './$types';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Service from './Service.svelte';
  import { Empty } from '$lib/components/empty';
  import Server from './Server.svelte';
  import fetchAction from '$lib/fetch-action';
  import CreateServerDialog from './CreateServerDialog.svelte';
  import { Button } from '$lib/components/ui/button';

  export let data: PageData;

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

    <CreateServerDialog data={data.form} let:builder>
      <Button builders={[builder]}>
        <i class="fas fa-plus mr-2"></i>
        Create Server
      </Button>
    </CreateServerDialog>
  </div>

  <div class="w-full space-y-3.5">
    <Card>
      {#if data.servers?.length < 1}
        <Empty description={'No server!'} />
      {:else}
        <CardHeader>
          <CardTitle>Servers</CardTitle>
        </CardHeader>
        <CardContent>
          {#each data.servers as server}
            <Server
              {server}
              on:rename={({ detail }) => handleRename(server.id.toString(), detail)}
            />
          {/each}
        </CardContent>
      {/if}
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
      </CardHeader>
      <CardContent>
        <Service name="Tor" slug="tor">
          <svelte:fragment slot="icon">
            <i class={'fa-solid fa-onion text-purple-700 text-xl'} />
          </svelte:fragment>
        </Service>
      </CardContent>
    </Card>
  </div></BasePage
>
