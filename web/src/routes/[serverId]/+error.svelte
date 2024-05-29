<script lang="ts">
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Empty } from '$lib/components/empty';
  import { Button } from '$lib/components/ui/button';
</script>

<Card>
  <CardHeader>
    <CardTitle>Server</CardTitle>
  </CardHeader>
  <CardContent class="flex flex-col items-center justify-center">
    <Empty description={'Server not found!'} />
  </CardContent>
  <CardFooter>
    <Button size="sm" on:click={() => window.history.back()}>Go Back</Button>
  </CardFooter>
</Card>
