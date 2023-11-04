<script lang="ts">
  import PageFooter from '$lib/components/page/PageFooter.svelte';
  import Logo from '$lib/assets/logo.png';
  import * as Form from '$lib/components/ui/form';
  import { formSchema, type FormSchema } from './schema';
  import type { SuperValidated } from 'sveltekit-superforms';

  export let form: SuperValidated<FormSchema>;
</script>

<div class={'w-full min-h-screen flex justify-center px-2 md:px-6 py-2'}>
  <div class={'w-full mx-auto max-w-3xl flex flex-col items-center gap-y-3.5'}>
    <header class={'flex items-center gap-x-2 text-3xl font-medium py-4'}>
      <img src={Logo} alt="WireAdmin" width="40" height="40" />
      <h1>WireAdmin</h1>
    </header>
    <main class={'py-4'}>
      <div class="w-full bg-white rounded-lg shadow-sm">
        <Form.Root method="POST" {form} schema={formSchema} let:config class="p-4 space-y-8">
          <div class="w-full flex items-center justify-center">
            <div class="w-16 aspect-square flex items-center justify-center rounded-full bg-gray-200">
              <i class="fas fa-user text-primary text-2xl" />
            </div>
          </div>

          <Form.Field {config} name="password">
            <Form.Item>
              <Form.Label>Password</Form.Label>
              <Form.Input type="password" autocomplete="off" />
              <Form.Validation />
            </Form.Item>
          </Form.Field>

          <Form.Button class="w-full">Sign In</Form.Button>
        </Form.Root>
      </div>
    </main>
    <PageFooter />
  </div>
</div>
