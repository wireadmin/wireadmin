<script lang="ts">
  import * as Form from '$lib/components/ui/form';
  import * as Card from '$lib/components/ui/card';
  import { formSchema, type FormSchema } from './schema';
  import type { SuperValidated } from 'sveltekit-superforms';

  export let form: SuperValidated<FormSchema>;
</script>

<Card.Root>
  <Card.Content>
    <Form.Root method="POST" {form} schema={formSchema} let:config class="pt-4 space-y-8">
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
  </Card.Content>
</Card.Root>
