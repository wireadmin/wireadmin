import { generateWgKey } from '$lib/wireguard';

describe('Keys', () => {
  it('should generate a key', async () => {
    const keys = await generateWgKey();
    console.log(keys);
  });
});
