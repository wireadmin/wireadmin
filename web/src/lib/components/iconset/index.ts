import type { SVGAttributes } from 'svelte/elements';

import Dnsmasq from './dnsmasq-icon.svelte';
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
  Dnsmasq,
  Onion,
  type Props,
  //
  Root as Icon,
  Dnsmasq as DnsmasqIcon,
  Onion as OnionIcon,
};
