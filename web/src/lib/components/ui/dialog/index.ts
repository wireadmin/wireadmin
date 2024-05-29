import { Dialog as DialogPrimitive } from 'bits-ui';

import Content from './dialog-content.svelte';
import Description from './dialog-description.svelte';
import Footer from './dialog-footer.svelte';
import Header from './dialog-header.svelte';
import Overlay from './dialog-overlay.svelte';
import Portal from './dialog-portal.svelte';
import Title from './dialog-title.svelte';

const Root = DialogPrimitive.Root;
const Trigger = DialogPrimitive.Trigger;
const Close = DialogPrimitive.Close;

export {
  Root,
  Title,
  Portal,
  Footer,
  Header,
  Trigger,
  Close,
  Overlay,
  Content,
  Description,
  //
  Root as Dialog,
  Title as DialogTitle,
  Portal as DialogPortal,
  Footer as DialogFooter,
  Header as DialogHeader,
  Trigger as DialogTrigger,
  Close as DialogClose,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Description as DialogDescription,
};
