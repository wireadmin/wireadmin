<script lang="ts">
  import { cn } from '$lib/utils';

  export let label: string;
</script>

<div
  class={cn(
    'flex flex-wrap items-center justify-between gap-2 py-3.5',
    'relative overflow-ellipsis',
    'leading-none',
    'border-b border-gray-200/80 last:border-none',
  )}
>
  <div class={'flex items-center text-gray-400 text-sm col-span-12 md:col-span-3'}>
    {label}
  </div>
  <div class={'flex items-center gap-x-2 col-span-12 md:col-span-9'}>
    <slot />
  </div>
</div>
