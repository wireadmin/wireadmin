<script lang="ts">
  import Logo from '$lib/assets/logo.png';

  export let showLogout: boolean = false;
</script>

<header class={'w-full py-3 px-2'}>
  <nav class={'w-full flex items-center justify-between'}>
    <div class={'flex items-center gap-x-2 text-3xl font-medium'}>
      <img src={Logo} alt="WireAdmin" width="40" height="40" />
      <h1>WireAdmin</h1>
    </div>

    <div class={'hidden md:flex items-center gap-x-2'}>
      <a href={'https://github.com/shahradelahi/wireadmin'} title={'Giv me a star on Github'}>
        <img
          src={'https://img.shields.io/github/stars/shahradelahi/wireadmin.svg?style=social&label=Star'}
          alt={'Giv me a star on Github'}
        />
      </a>

      {#if showLogout}
        <a href={'/logout'} title="logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-red-500 hover:text-red-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
      {/if}
    </div>
  </nav>
</header>
