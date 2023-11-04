<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import BasePage from '$lib/components/page/BasePage.svelte';
  import * as Card from '$lib/components/ui/card';
</script>

<BasePage showLogout={true}>
  <div class={'flex items-center justify-between py-3 px-2'}>
    <h2 class={'font-bold text-xl'}>Hello there 👋</h2>
  </div>

  <Card.Root>
    <Card.Content>
      <h1>Welcome to SvelteKit</h1>
      <p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

      <Button variant="outline">Button</Button>
    </Card.Content>
  </Card.Root>
</BasePage>
