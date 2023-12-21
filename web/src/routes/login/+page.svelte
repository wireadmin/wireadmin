<script lang="ts">
  import { formSchema, type FormSchema } from './schema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { Card, CardContent } from '$lib/components/ui/card';
  import {
    Form,
    FormButton,
    FormField,
    FormInput,
    FormItem,
    FormLabel,
    FormValidation,
  } from '$lib/components/ui/form';
  import { goto } from '$app/navigation';
  import type { FormOptions } from 'formsnap';

  export let form: SuperValidated<FormSchema>;

  const options: FormOptions<typeof formSchema> = {
    validators: formSchema,
    warnings: {
      noValidationAndConstraints: false,
    },
    onResult: ({ result }) => {
      if (result.type === 'success') {
        goto('/');
      } else {
        console.error('Server-failure: Validation failed');
      }
    },
  };
</script>

<Card>
  <CardContent>
    <Form {form} {options} schema={formSchema} let:config let:enhance asChild>
      <form method="POST" class="pt-4 space-y-8" use:enhance>
        <div class="w-full flex items-center justify-center">
          <div class="w-16 aspect-square flex items-center justify-center rounded-full bg-gray-200">
            <i class="fas fa-user text-primary text-2xl" />
          </div>
        </div>

        <FormField {config} name="password">
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormInput type="password" autocomplete="off" />
            <FormValidation />
          </FormItem>
        </FormField>

        <FormButton class="w-full">Sign In</FormButton>
      </form>
    </Form>
  </CardContent>
</Card>
