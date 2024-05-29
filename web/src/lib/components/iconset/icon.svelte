<script lang="ts">
  import { cn } from '$lib/utils.js';

  export let name: string | undefined = undefined;
  export let color = 'currentColor';
  export let size: number | string = 24;
  export let strokeWidth: number | string = 2;
  export let absoluteStrokeWidth: boolean = false;
</script>

<svg
  {...$$restProps}
  width={size}
  height={size}
  stroke={color}
  stroke-width={absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth}
  class={cn('lucide-icon', 'lucide', name ? `lucide-${name}` : '', $$props.class)}
>
  <slot />
</svg>
