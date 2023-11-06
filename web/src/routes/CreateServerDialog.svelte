<script lang="ts">
  import { CreateServerSchema, type CreateServerSchemaType } from './schema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import {
    Form,
    FormButton,
    FormDescription,
    FormField,
    FormInput,
    FormLabel,
    FormValidation,
  } from '$lib/components/ui/form';
  import { goto } from '$app/navigation';
  import { FormItem } from '$lib/components/ui/form/index.js';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';

  let form: SuperValidated<CreateServerSchemaType>;
  export let isOpen = false;
</script>

<Dialog open={isOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Server</DialogTitle>
    </DialogHeader>
    <SuperDebug data={form} />
    <Form
      {form}
      schema={CreateServerSchema}
      class="space-y-3.5"
      action="?/create"
      method={'POST'}
      let:config
      options={{
        onResult: ({ result }) => {
          if (result.type === 'success') {
            goto('/');
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
          <FormDescription>This is the port that the WireGuard server will listen on.</FormDescription>
          <FormValidation />
        </FormItem>
      </FormField>

      <FormField {config} name={'dns'}>
        <FormItem>
          <FormLabel>DNS</FormLabel>
          <FormInput placeholder={'e.g. 1.1.1.1'} type={'text'} />
          <FormDescription>Optional. This is the DNS server that will be pushed to clients.</FormDescription>
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

      <DialogFooter>
        <FormButton type="submit">Create</FormButton>
      </DialogFooter>
    </Form>
  </DialogContent>
</Dialog>
