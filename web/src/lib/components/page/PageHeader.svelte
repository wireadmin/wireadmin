<script lang="ts">
  import Sun from 'lucide-svelte/icons/sun';
  import Moon from 'lucide-svelte/icons/moon';

  import { toggleMode } from 'mode-watcher';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  export let showLogout: boolean = false;
</script>

<header class={'w-full py-3 px-2'}>
  <nav class={'w-full flex items-center justify-between'}>
    <div class={'flex items-center gap-x-2 text-3xl font-medium'}>
      <img src={'/logo.png'} alt="WireAdmin" width="40" height="40" class="max-sm:w-8" />
      <h1 class="max-sm:text-lg">WireAdmin</h1>
    </div>

    <div class={'flex items-center gap-x-3'}>
      <a
        href={'https://github.com/shahradelahi/wireadmin'}
        title={'Giv me a star on Github'}
        class="hidden md:block"
      >
        <img
          src={'https://img.shields.io/github/stars/shahradelahi/wireadmin.svg?style=social&label=Star'}
          alt={'Gimme a Star'}
        />
      </a>

      <Button on:click={toggleMode} variant="ghost" size="icon">
        <Sun
          class="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Moon
          class="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>

      {#if showLogout}
        <a href="/logout" rel="external" title="Logout">
          <Button variant="ghost" class="group text-sm/2 gap-x-2 font-medium">
            <i
              class={cn(
                'far fa-arrow-right-from-arc text-sm mr-0.5',
                'text-neutral-500 group-hover:text-neutral-800',
                'dark:text-neutral-400 dark:group-hover:text-neutral-100',
              )}
            ></i>
            <span
              class="text-neutral-700 hover:text-neutral-800 dark:text-neutral-100 dark:hover:text-neutral-100"
              >Logout</span
            >
          </Button>
        </a>
      {/if}
    </div>
  </nav>
</header>
