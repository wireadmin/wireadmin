import Network from '$lib/network';

describe('Network', () => {
  it('should return default interface', async () => {
    const inet = await Network.defaultInterface();
    console.log(inet);
  });

  it('should return in use ports', async () => {
    const ports = await Network.inUsePorts();
    console.log(ports);
  });

  it('should check interface exists', async () => {
    const exists = await Network.interfaceExists('lo');
    console.log(exists);
  });
});
