import adapter from '@sveltejs/adapter-node';
import sveltePreprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: [sveltePreprocess()],
  kit: {
    adapter: adapter(),
    alias: {
      '@lib': './src/lib',
    },
    csrf: { checkOrigin: false },
  },
};
