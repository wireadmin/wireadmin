<script lang="ts">
  import { CreateServerSchema, type CreateServerSchemaType } from './schema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '$lib/components/ui/dialog';
  import {
    Form,
    FormButton,
    FormDescription,
    FormField,
    FormInput,
    FormLabel,
    FormSwitch,
    FormValidation,
  } from '$lib/components/ui/form';
  import { FormItem } from '$lib/components/ui/form/index.js';
  import { cn } from '$lib/utils';
  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from '$lib/components/ui/collapsible';
  import { Button } from '$lib/components/ui/button';
  import toast from 'svelte-french-toast';

  let loading: boolean = false;
  let dialogOpen = false;

  let form: SuperValidated<CreateServerSchemaType>;
</script>

<Dialog bind:open={dialogOpen}>
  <DialogTrigger asChild let:builder>
    <slot {builder} />
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Server</DialogTitle>
    </DialogHeader>
    <Form
      {form}
      schema={CreateServerSchema}
      class="space-y-3.5"
      action="?/create"
      method={'POST'}
      let:config
      options={{
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
      }}
    >
      <FormField {config} name={'name'}>
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormInput placeholder={'e.g. CuteHub'} type={'text'} />
          <FormValidation />
        </FormItem>
      </FormField>

      <FormField {config} name={'address'}>
        <FormItem>
          <FormLabel>Address</FormLabel>
          <FormInput placeholder={'e.g. 10.8.0.1'} type={'text'} />
          <FormDescription>This is the Private IP Address of the server.</FormDescription>
          <FormValidation />
        </FormItem>
      </FormField>

      <FormField {config} name={'port'}>
        <FormItem>
          <FormLabel>Port</FormLabel>
          <FormInput placeholder={'e.g. 51820'} type={'text'} />
          <FormDescription
            >This is the port that the WireGuard server will listen on.</FormDescription
          >
          <FormValidation />
        </FormItem>
      </FormField>

      <Collapsible>
        <CollapsibleTrigger asChild let:builder>
          <Button builders={[builder]} variant="ghost" size="sm" class="mb-4 -mr-2">
            <i class="far fa-cog mr-2"></i>
            <span>Advanced Options</span>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent class="space-y-6">
          <FormField {config} name={'tor'}>
            <FormItem class="flex items-center justify-between">
              <div class="space-y-0.5">
                <FormLabel>Use Tor</FormLabel>
                <FormDescription>This will route all outgoing traffic through Tor.</FormDescription>
              </div>
              <FormSwitch />
            </FormItem>
          </FormField>

          <FormField {config} name={'dns'}>
            <FormItem>
              <FormLabel>DNS</FormLabel>
              <FormInput placeholder={'e.g. 1.1.1.1'} type={'text'} />
              <FormDescription
                >Optional. This is the DNS server that will be pushed to clients.</FormDescription
              >
              <FormValidation />
            </FormItem>
          </FormField>

          <FormField {config} name={'mtu'}>
            <FormItem>
              <FormLabel>MTU</FormLabel>
              <FormInput placeholder={'1350'} type={'text'} />
              <FormDescription>Optional. Recommended to leave this blank.</FormDescription>
              <FormValidation />
            </FormItem>
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
    </Form>
  </DialogContent>
</Dialog>
