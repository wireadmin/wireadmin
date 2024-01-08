<script lang="ts">
  export let showLogout: boolean = false;
</script>

<header class={'w-full py-3 px-2'}>
  <nav class={'w-full flex items-center justify-between'}>
    <div class={'flex items-center gap-x-2 text-3xl font-medium'}>
      <img src={'/logo.png'} alt="WireAdmin" width="40" height="40" class="max-sm:w-8" />
      <h1 class="max-sm:text-lg">WireAdmin</h1>
    </div>

    <div class={'flex items-center gap-x-8'}>
      <a
        href={'https://github.com/shahradelahi/wireadmin'}
        title={'Giv me a star on Github'}
        class="hidden md:block"
      >
        <img
          src={'https://img.shields.io/github/stars/shahradelahi/wireadmin.svg?style=social&label=Star'}
          alt={'Giv me a star on Github'}
        />
      </a>

      {#if showLogout}
        <a
          href="/logout"
          rel="external"
          title="Logout"
          class="group text-sm/2 font-medium text-neutral-700 hover:text-neutral-800"
        >
          <i
            class="far fa-arrow-right-from-arc text-sm text-neutral-500 group-hover:text-neutral-800 mr-0.5"
          ></i>
          Logout
        </a>
      {/if}
    </div>
  </nav>
</header>
