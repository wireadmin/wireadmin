<script lang="ts">
  import { cn } from '$lib/utils';

  export let content: string;
  export let maxLength: number = Math.floor(content.length / 2);
  export let rootClass: string | undefined = undefined;

  let className: string | undefined = undefined;
  export { className as class };
</script>

<span class={rootClass}>
  {content.slice(0, maxLength)}
  <span class={cn('text-gray-400', className)}> ... </span>
  {content.slice(content.length - maxLength)}
</span>
