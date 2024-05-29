<script lang="ts">
  import { cn } from '$lib/utils';
  import { createEventDispatcher } from 'svelte';
  import type { ZodEffects, ZodString } from 'zod';
  import { SquarePenIcon } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';

  export let editMode: boolean = false;
  export let schema: ZodString | ZodEffects<any>;
  export let rootClass: string | undefined = undefined;
  export let inputClass: string | undefined = undefined;
  export let value: string;
  export let error: boolean = false;
  export let asChild: boolean = false;
  let className: string | undefined = undefined;
  export { className as class };

  const dispatch = createEventDispatcher();

  const handleEnterEditMode = () => {
    editMode = true;
  };

  const handleExitEditMode = async () => {
    editMode = false;
    dispatch('change', { value });
  };
</script>

<div class={cn('group flex items-center leading-none gap-x-3', rootClass)}>
  {#if asChild}
    <slot {editMode} />
  {:else}
    <span class={cn(editMode ? 'hidden' : 'flex items-center gap-x-2', 'leading-none', className)}>
      {value}
    </span>
  {/if}

  <input
    type="text"
    class={cn(
      editMode ? 'block' : 'hidden',
      'w-full ring-2 ring-neutral-800 ring-offset-2 rounded transition-colors duration-200 ease-in-out outline-transparent',
      inputClass,
      error && 'ring-red-500 rounded'
    )}
    {value}
    on:keydown={(e) => {
      if (e.key === 'Enter') {
        // @ts-ignore
        let val = e.target.value ?? '';
        if (!schema.safeParse(val).success) {
          editMode = true;
          error = true;
          return;
        }
        value = val;
        handleExitEditMode();
      } else if (e.key === 'Escape') {
        editMode = false;
      }
    }}
  />

  <Button
    class="opacity-0 group-hover:opacity-100 text-gray-400/80 group-hover:text-primary"
    aria-roledescription="Edit"
    size="none"
    variant="ghost"
    on:click={handleEnterEditMode}
    on:keydown={(e) => {
      if (e.key === 'Enter') handleEnterEditMode();
    }}
  >
    <SquarePenIcon class="h-4 w-4" />
  </Button>
</div>
