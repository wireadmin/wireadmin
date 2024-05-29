<script lang="ts">
  import { cn } from '$lib/utils';
  import { EmptyDescription, EmptySimpleImage, type Props } from '.';

  type $$Props = Props;

  let className: $$Props['class'] = undefined;
  export let description: $$Props['description'] = 'No data!';
  export { className as class };
</script>

<div class={cn('m-8 leading-8 text-md text-center', className)} {...$$restProps}>
  <div class="mb-2">
    {#if !!$$slots.default}
      <slot />
    {:else}
      <EmptySimpleImage />
    {/if}
  </div>
  {#if !!description}
    <EmptyDescription>{description}</EmptyDescription>
  {/if}
</div>
