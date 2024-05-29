<script lang="ts">
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import fetchAction from '$lib/utils/fetch-action';
  import { Button } from '$lib/components/ui/button';
  import toast from 'svelte-french-toast';
  import { LoaderCircle } from 'lucide-svelte';
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from '$lib/components/ui/breadcrumb';
  import BasePage from '$lib/components/page/BasePage.svelte';
  import { Checkbox } from '$lib/components/ui/checkbox';

  export let data: PageData;

  let logElement: HTMLTextAreaElement;
  let logs: string | undefined;
  let autoScroll = true;

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

      if (logs === '') {
        logs = 'Logs are not available!';
      }

      if (autoScroll) {
        scrollToBottom(logElement);
      }
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

  const scrollToBottom = async (node: HTMLTextAreaElement) => {
    node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
  };

  onMount(() => {
    const interval = setInterval(() => {
      getServiceLogs();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<BasePage showLogout={true}>
  <div class="flex items-center gap-2 py-4 px-2 leading-none">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{data.title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </div>

  <div class="space-y-3.5">
    <Card>
      <CardHeader>
        <CardTitle>Logs</CardTitle>
      </CardHeader>
      <CardContent class="relative">
        <textarea
          class="w-full h-80 p-2 border border-border rounded-sm text-sm"
          readonly
          bind:value={logs}
          bind:this={logElement}
        />
        {#if !logs}
          <div class="absolute inset-0 flex items-center justify-center">
            <LoaderCircle class={'h-10 w-10 animate-spin'} />
          </div>
        {/if}
      </CardContent>
      <CardFooter class="flex justify-between">
        <div class="flex items-center gap-2">
          <Checkbox bind:checked={autoScroll} />
          <span>Auto scroll</span>
        </div>
        <div class="flex gap-2">
          <Button on:click={restart} variant="outline">Restart</Button>
          <Button variant="destructive" on:click={clearLogs} disabled={!logs}>Clear</Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</BasePage>
