<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import fetchAction from '$lib/fetch-action';
  import { Button } from '$lib/components/ui/button';
  import { CardFooter } from '$lib/components/ui/card/index.js';
  import toast from 'svelte-french-toast';
  import Layout from './Layout.svelte';

  export let data: PageData;

  let logs: string | undefined;

  const getServiceLogs = async (): Promise<void> => {
    const resp = await fetchAction({
      action: '?/logs',
      method: 'POST',
      form: {},
    });
    if (resp.ok) {
      const { data: jsonStr } = await resp.json();
      const data = JSON.parse(jsonStr);
      logs = data[1].toString().trim();
    } else {
      console.error('failed to get logs');
      logs = undefined;
    }
  };

  const clearLogs = async (): Promise<void> => {
    const resp = await fetchAction({
      action: '?/clearLogs',
      method: 'POST',
      form: {},
    });
    if (resp.ok) {
      toast.success('Logs cleared!');
      logs = '';
    } else {
      toast.error('Failed to clear logs');
    }
  };

  const restart = async (): Promise<void> => {
    const resp = await fetchAction({
      action: '?/restart',
      method: 'POST',
      form: {},
    });
    if (resp.ok) {
      toast.success('Restarting...');
    } else {
      toast.error('Failed to restart');
    }
  };

  onMount(() => {
    const interval = setInterval(() => {
      getServiceLogs();
    }, 1000);

    return () => {
      console.log('clearing interval');
      clearInterval(interval);
    };
  });
</script>

<Layout title={data.title}>
  <Card>
    <CardHeader>
      <CardTitle>Logs</CardTitle>
    </CardHeader>
    <CardContent class="relative">
      <textarea class="w-full h-64 p-2 bg-gray-100" readonly bind:value={logs} />
      {#if !logs}
        <div class="absolute inset-0 flex items-center justify-center">
          <i class="text-4xl animate-spin fas fa-circle-notch"></i>
        </div>
      {/if}
    </CardContent>
    <CardFooter class="flex justify-end gap-2">
      <Button on:click={restart}>Restart</Button>
      <Button variant="destructive" on:click={clearLogs} disabled={!logs}>Clear</Button>
    </CardFooter>
  </Card>
</Layout>
