<script lang="ts">
  import { cn } from '$lib/utils';
  import { createEventDispatcher } from 'svelte';
  import { Button } from 'bits-ui';

  type $$Props = Button.Props & {
    disabled?: boolean;
    loading?: boolean;
  };

  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let builders: $$Props['builders'] = [];

  const dispatch = createEventDispatcher();

  function handleClick() {
    if (disabled || loading) return;
    dispatch('click');
  }
</script>

<Button.Root
  {builders}
  {...$$restProps}
  class={cn(
    'group flex items-center justify-center w-10 aspect-square rounded-md',
    'bg-gray-200/80 hover:bg-gray-100/50',
    'border border-transparent hover:border-primary',
    'transition-colors duration-200 ease-in-out',
    'cursor-pointer',
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'animate-pulse',
  )}
  on:click={handleClick}
  on:keydown={(e) => {
    if (e.key === 'Enter') handleClick();
  }}
>
  {#if loading}
    <i class="far fa-spinner-third fa-spin" />
  {:else}
    <slot />
  {/if}
</Button.Root>
