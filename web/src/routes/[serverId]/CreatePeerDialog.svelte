<script lang="ts">
  import { CreatePeerSchema, type CreatePeerSchemaType } from './schema';
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
    FormField,
    FormInput,
    FormItem,
    FormLabel,
    FormValidation,
  } from '$lib/components/ui/form';
  import { cn } from '$lib/utils';
  import { invalidateAll } from '$app/navigation';
  import toast from 'svelte-french-toast';

  let loading: boolean = false;
  let dialogOpen = false;

  let form: SuperValidated<CreatePeerSchemaType>;

  const handleSuccess = async () => {
    await invalidateAll();
    toast.success('Peer created!');
    dialogOpen = false;
  };
</script>

<Dialog bind:open={dialogOpen}>
  <DialogTrigger asChild let:builder>
    <slot {builder} />
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Peer</DialogTitle>
    </DialogHeader>
    <Form
      {form}
      schema={CreatePeerSchema}
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
          if (result.type === 'success') {
            handleSuccess();
          } else {
            toast.error('Failed to create peer');
            console.error('Server-failure: Result:', result);
          }
          loading = false;
        },
      }}
    >
      <FormField {config} name={'name'}>
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormInput placeholder={'e.g. Unicorn'} type={'text'} />
          <FormValidation />
        </FormItem>
      </FormField>

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
