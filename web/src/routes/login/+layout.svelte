<script lang="ts">
  import PageFooter from '$lib/components/page/PageFooter.svelte';
  import Logo from '../../../static/logo.png';
</script>

<div class={'w-full min-h-screen flex justify-center px-2 md:px-6 py-2'}>
  <div class={'w-full mx-auto max-w-3xl flex flex-col items-center gap-y-3.5'}>
    <header class={'flex items-center gap-x-2 text-3xl font-medium py-4'}>
      <img src={Logo} alt="WireAdmin" width="40" height="40" />
      <h1>WireAdmin</h1>
    </header>
    <main class={'py-4'}>
      <slot />
    </main>
    <PageFooter />
  </div>
</div>
