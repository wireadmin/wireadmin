<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { onMount } from 'svelte';

  export let name: string;
  export let slug: string;
  let healthy: boolean;

  const getHealth = async (slug: string): Promise<void> => {
    const res = await fetch(`/api/health/${slug}`);
    if (res.ok) {
      const data = (await res.json()) as { healthy: boolean };
      healthy = data.healthy;
    }
  };

  onMount(() => {
    getHealth(slug);
  });
</script>

<div class="flex items-center justify-between py-4 gap-x-4">
  <div class="w-full md:w-2/3 flex items-center gap-x-2">
    <div class="flex grow">
      <div
        class={'w-12 aspect-square flex items-center justify-center mr-4 rounded-full bg-gray-200 max-md:hidden'}
      >
        <slot name="icon" />
      </div>

      <a href={`/service/${slug}`} title="Manage" class="my-auto">
        <span class="text-lg font-medium md:text-base hover:text-primary hover:font-medium">
          {name}
        </span>
      </a>
    </div>
    <div class={'flex col-span-4 items-center justify-end'}>
      {#if healthy === undefined}
        <i class="fas fa-spinner animate-spin" />
      {:else}
        <Badge variant={healthy ? 'success' : 'destructive'} />
      {/if}
    </div>
  </div>

  <a href={`/service/${slug}`} title="Manage the Server" class="hidden md:block">
    <Button variant="outline" size="sm">Manage</Button>
  </a>
</div>
