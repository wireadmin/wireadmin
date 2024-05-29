import type { HTMLAttributes } from 'svelte/elements';

import Description from './empty-description.svelte';
import SimpleImage from './empty-simple-img.svelte';
import Root from './empty.svelte';

interface Props extends HTMLAttributes<HTMLDivElement> {
  description?: string | null;
}

export {
  Root,
  Description,
  SimpleImage,
  type Props,
  //
  Root as Empty,
  Description as EmptyDescription,
  SimpleImage as EmptySimpleImage,
  type Props as EmptyProps,
};
