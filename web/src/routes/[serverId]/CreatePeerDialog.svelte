<script lang="ts">
  import { createPeerSchema, type CreatePeerSchemaType } from './schema';
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
    FormField,
    FormFieldErrors,
    FormLabel,
  } from '$lib/components/ui/form';
  import { cn } from '$lib/utils';
  import { invalidateAll } from '$app/navigation';
  import toast from 'svelte-french-toast';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { Input } from '$lib/components/ui/input';
  import { LoaderCircle } from 'lucide-svelte';

  let loading: boolean = false;
  export let open = false;

  export let data: SuperValidated<Infer<CreatePeerSchemaType>>;

  const form = superForm(data, {
    dataType: 'json',
    validators: zodClient(createPeerSchema),
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
  });

  const { form: formData, enhance, submitting } = form;

  const handleSuccess = async () => {
    await invalidateAll();
    toast.success('Peer created!');
    open = false;
  };
</script>

<Dialog bind:open>
  <DialogTrigger asChild let:builder>
    <slot {builder} />
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Peer</DialogTitle>
    </DialogHeader>
    <form class="space-y-3.5" method="POST" action="?/create" use:enhance>
      <FormField {form} name={'name'}>
        <FormControl let:attrs>
          <FormLabel>Name</FormLabel>
          <Input
            {...attrs}
            bind:value={$formData.name}
            placeholder={'e.g. Unicorn'}
            type={'text'}
          />
        </FormControl>
        <FormFieldErrors />
      </FormField>

      <DialogFooter>
        <FormButton disabled={$submitting}>
          <LoaderCircle class={cn('mr-2 h-4 w-4 animate-spin', !$submitting && 'hidden')} />
          Create
        </FormButton>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
