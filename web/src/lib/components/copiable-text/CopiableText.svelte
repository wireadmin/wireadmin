<script lang="ts">
  import { cn } from '$lib/utils';

  export let showInHover: boolean = false;
  export let rootClass: string | undefined = undefined;
  export let value: string | number;
  let className: string | undefined = undefined;
  export { className as class };

  const handleCopy = () => {
    navigator.clipboard.writeText(value?.toString() || '');
  };
</script>

<div class={cn('group flex items-center', rootClass)}>
  <slot />
  <i
    aria-roledescription="Copy to clipboard"
    role="button"
    tabindex="0"
    class={cn(
      'ml-2 mb-0.5 far fa-copy cursor-pointer text-gray-400/80 hover:text-primary',
      showInHover && 'group-hover:opacity-100 opacity-0',
      className,
    )}
    on:click={handleCopy}
    on:keydown={(e) => {
      if (e.key === 'Enter') handleCopy();
    }}
  />
</div>
