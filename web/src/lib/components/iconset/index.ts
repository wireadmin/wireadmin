import type { SVGAttributes } from 'svelte/elements';

import Root from './icon.svelte';
import Onion from './onion-icon.svelte';

interface Props extends SVGAttributes<SVGSVGElement> {
  color?: string;
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  class?: string;
}

export {
  Root,
  Onion,
  type Props,
  //
  Root as Icon,
  Onion as OnionIcon,
};
