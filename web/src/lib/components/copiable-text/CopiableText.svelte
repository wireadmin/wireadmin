<script lang="ts">
  import { cn } from '$lib/utils';
  import { ClipboardCopyIcon } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';

  export let showInHover: boolean = false;
  export let rootClass: string | undefined = undefined;
  export let value: string | number;
  let className: string | undefined = undefined;
  export { className as class };

  const handleCopy = () => {
    navigator.clipboard.writeText(value?.toString() || '');
  };
</script>

<div class={cn('group flex items-center gap-3', rootClass)}>
  <slot />
  <Button
    aria-roledescription="Copy to clipboard"
    size="none"
    variant="ghost"
    on:click={handleCopy}
    on:keydown={(e) => {
      if (e.key === 'Enter') handleCopy();
    }}
  >
    <ClipboardCopyIcon
      class={cn(
        'h-4 w-4 cursor-pointer text-gray-400/80 hover:text-primary',
        showInHover && 'group-hover:opacity-100 opacity-0',
        className
      )}
    />
  </Button>
</div>
