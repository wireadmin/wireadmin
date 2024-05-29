<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import type { WgServer } from '$lib/typings';
  import { EditableText } from '$lib/components/editable-text';
  import { CopiableText } from '$lib/components/copiable-text';
  import { NameSchema } from '$lib/wireguard/schema';
  import { Badge } from '$lib/components/ui/badge';
  import { createEventDispatcher } from 'svelte';
  import { cn } from '$lib/utils';
  import { LayersIcon } from 'lucide-svelte';
  import { OnionIcon } from '$lib/components/iconset';

  export let server: WgServer;
  export let addressPort: string = `${server.address}:${server.listen}`;

  const dispatch = createEventDispatcher();
</script>

<div class="flex items-center justify-between py-4 gap-x-4">
  <div class="w-full md:w-2/3 flex items-center gap-x-2">
    <div class="flex grow">
      <div
        class={cn(
          'relative w-12 h-12 aspect-square',
          'flex items-center justify-center mr-4 ',
          'bg-gray-200 max-md:hidden',
          'rounded-full'
        )}
      >
        <LayersIcon class="text-gray-400 text-xl" />
        {#if server.tor}
          <OnionIcon class="absolute bottom-2 right-2 w-4 h-4" />
        {/if}
      </div>

      <div class="h-full flex flex-col justify-between col-span-4 gap-y-1.5">
        <EditableText
          value={server.name}
          schema={NameSchema}
          rootClass="font-medium"
          inputClass="w-full max-w-[120px]"
          on:change={({ detail }) => {
            dispatch('rename', detail.value.toString());
          }}
          let:editMode
          asChild
        >
          <a href={`/${server.id}`} title="Manage the Server" class={cn({ hidden: editMode })}>
            <span class="text-lg font-medium md:text-base hover:text-primary hover:font-medium">
              {server.name}
            </span>
          </a>
        </EditableText>
        <CopiableText value={addressPort} class="text-sm" showInHover={true}>
          <span class={'font-mono text-gray-400 text-xs'}> {addressPort} </span>
        </CopiableText>
      </div>
    </div>
    <div class={'flex col-span-4 justify-end'}>
      <Badge variant={server.status === 'up' ? 'success' : 'destructive'} />
    </div>
  </div>

  <a href={`/${server.id}`} title="Manage the Server" class="hidden md:block">
    <Button variant="outline" size="sm">Manage</Button>
  </a>
</div>
