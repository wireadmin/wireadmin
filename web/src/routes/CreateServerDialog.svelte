<script lang="ts">
  import { createServerSchema, type CreateServerSchemaType } from './schema';
  import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '$lib/components/ui/dialog';
  import {
    FormButton,
    FormControl,
    FormDescription,
    FormField,
    FormFieldErrors,
    FormLabel,
  } from '$lib/components/ui/form';
  import { cn } from '$lib/utils';
  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from '$lib/components/ui/collapsible';
  import { Button } from '$lib/components/ui/button';
  import toast from 'svelte-french-toast';
  import { Input } from '$lib/components/ui/input';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { Switch } from '$lib/components/ui/switch';

  let loading: boolean = false;
  let dialogOpen = false;

  export let data: SuperValidated<Infer<CreateServerSchemaType>>;

  const form = superForm(data, {
    dataType: 'json',
    validators: zodClient(createServerSchema),
    onSubmit: () => {
      loading = true;
    },
    onError: (e) => {
      loading = false;
      console.error('Client-side: FormError:', e);
    },
    onResult: ({ result }) => {
      loading = false;
      if (result.type === 'success') {
        dialogOpen = false;
        toast.success('Server created successfully!');
      } else {
        console.error('Server-failure: Result:', result);
        toast.error('Server failed to create.');
      }
    },
  });

  const { form: formData, enhance } = form;
</script>

<Dialog bind:open={dialogOpen}>
  <DialogTrigger asChild let:builder>
    <slot {builder} />
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Server</DialogTitle>
    </DialogHeader>

    <form method="POST" action="?/create" use:enhance>
      <FormField {form} name={'name'}>
        <FormControl let:attrs>
          <FormLabel>Name</FormLabel>
          <Input
            {...attrs}
            bind:value={$formData.name}
            placeholder={'e.g. CuteHub'}
            type={'text'}
          />
          <FormFieldErrors />
        </FormControl>
      </FormField>

      <FormField {form} name={'address'}>
        <FormControl let:attrs>
          <FormLabel>Address</FormLabel>
          <Input
            {...attrs}
            bind:value={$formData.address}
            placeholder={'e.g. 10.8.0.1'}
            type={'text'}
          />
        </FormControl>
        <FormDescription>This is the Private IP Address of the server.</FormDescription>
        <FormFieldErrors />
      </FormField>

      <FormField {form} name={'port'}>
        <FormControl let:attrs>
          <FormLabel>Port</FormLabel>
          <Input {...attrs} bind:value={$formData.port} placeholder={'e.g. 51820'} type={'text'} />
        </FormControl>
        <FormDescription>This is the port that the WireGuard server will listen on.</FormDescription
        >
        <FormFieldErrors />
      </FormField>

      <Collapsible>
        <CollapsibleTrigger asChild let:builder>
          <Button builders={[builder]} variant="ghost" size="sm" class="mb-4 -mr-2">
            <i
              class={cn('far fa-cog mr-2', builder['data-state'] === 'open' ? 'animate-spin' : '')}
            />
            <span>Advanced Options</span>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent class="space-y-6">
          <FormField {form} name={'tor'}>
            <FormControl let:attrs>
              <Switch {...attrs} bind:checked={$formData.tor} />
              <FormLabel>Use Tor</FormLabel>
            </FormControl>
            <FormDescription>This will route all outgoing traffic through Tor.</FormDescription>
          </FormField>

          <FormField {form} name={'dns'}>
            <FormControl let:attrs>
              <FormLabel>DNS</FormLabel>
              <Input placeholder={'e.g. 1.1.1.1'} type={'text'} />
            </FormControl>
            <FormDescription
              >Optional. This is the DNS server that will be pushed to clients.</FormDescription
            >
            <FormFieldErrors />
          </FormField>

          <FormField {form} name={'mtu'}>
            <FormControl let:attrs>
              <FormLabel>MTU</FormLabel>
              <Input {...attrs} bind:value={$formData.mtu} placeholder={'1350'} type={'text'} />
            </FormControl>
            <FormDescription>Optional. Recommended to leave this blank.</FormDescription>
            <FormFieldErrors />
          </FormField>
        </CollapsibleContent>
      </Collapsible>

      <DialogFooter>
        <FormButton>
          <i class={cn(loading ? 'far fa-arrow-rotate-right animate-spin' : 'far fa-plus', 'mr-2')}
          ></i>
          Create
        </FormButton>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
