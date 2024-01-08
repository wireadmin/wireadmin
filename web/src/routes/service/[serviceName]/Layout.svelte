<script lang="ts">
  import BasePage from '$lib/components/page/BasePage.svelte';

  export let title: string;
</script>

<BasePage showLogout={true}>
  <div class="flex items-center gap-2 py-4 px-2 leading-none">
    <a
      href="/"
      title="Home"
      class="space-x-1 font-bold text-sm text-primary hover:text-primary/80 tracking-tight"
    >
      <i class="fa-solid fa-chevron-left"></i>
      <span> Back to Home </span>
    </a>
    <i class="fa-regular fa-slash-forward"></i>
    <span class="mb-0.5"> {title} </span>
  </div>

  <div class="space-y-3.5">
    <slot />
  </div>
</BasePage>
