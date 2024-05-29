<script lang="ts">
  import { formSchema, type FormSchema } from './schema';
  import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
  import { Card, CardContent } from '$lib/components/ui/card';
  import {
    FormButton,
    FormControl,
    FormField,
    FormFieldErrors,
    FormLabel,
  } from '$lib/components/ui/form';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { goto } from '$app/navigation';
  import { Input } from '$lib/components/ui/input';
  import { LoaderCircle, UserIcon } from 'lucide-svelte';
  import { cn } from '$lib/utils';

  export let data: SuperValidated<Infer<FormSchema>>;

  const form = superForm(data, {
    dataType: 'json',
    validators: zodClient(formSchema),
    onResult: ({ result }) => {
      if (result.type === 'success') {
        goto('/');
      } else {
        console.error('Server-failure: Validation failed');
      }
    },
  });

  const { form: formData, enhance, submitting } = form;
</script>

<Card>
  <CardContent>
    <form method="POST" class="pt-4 space-y-8" use:enhance>
      <div class="w-full flex items-center justify-center">
        <div class="w-16 aspect-square flex items-center justify-center rounded-full bg-gray-200">
          <UserIcon class="text-gray-400 text-3xl" />
        </div>
      </div>

      <FormField {form} name="password">
        <FormControl let:attrs>
          <FormLabel>Password</FormLabel>
          <Input
            {...attrs}
            bind:value={$formData.password}
            type="password"
            autocomplete="off"
            disabled={$submitting}
          />
        </FormControl>
        <FormFieldErrors />
      </FormField>

      <FormButton class="w-full" disabled={$submitting}>
        <LoaderCircle class={cn('mr-2 h-4 w-4 animate-spin', !$submitting && 'hidden')} />
        {$submitting ? 'Authenticating...' : 'Sign In'}
      </FormButton>
    </form>
  </CardContent>
</Card>
