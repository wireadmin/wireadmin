<script lang="ts">
  import { cn } from '$lib/utils';
  import PageFooter from '$lib/components/page/PageFooter.svelte';
  import PageHeader from '$lib/components/page/PageHeader.svelte';

  export let rootClass: string | undefined = undefined;
  let className: string | undefined = undefined;
  export let showLogout: boolean = false;
  export { className as class };
</script>

<div class="w-full min-h-screen flex justify-center px-2 md:px-6 py-2">
  <div class={cn('w-full mx-auto max-w-3xl space-y-3.5', rootClass)}>
    <PageHeader {showLogout} />
    <main
      class={cn('flex flex-col items-center justify-between py-3 px-2 [&>*]:w-full', className)}
    >
      <slot />
    </main>
    <PageFooter />
  </div>
</div>
