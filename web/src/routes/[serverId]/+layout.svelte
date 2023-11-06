<script>
  import { Button } from '$lib/components/ui/button';
  import BasePage from '$lib/components/page/BasePage.svelte';
</script>

<BasePage showLogout={true}>
  <div class="py-3 px-2">
    <a href="/" title="Home">
      <Button variant="outline" class="leading-none px-3 space-x-2.5">
        <i class="far fa-arrow-left"></i>
        <span> Back to Home </span>
      </Button>
    </a>
  </div>

  <div class="space-y-3.5">
    <slot />
  </div>
</BasePage>
