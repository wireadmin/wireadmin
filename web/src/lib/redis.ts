import IORedis from 'ioredis';

export const client = new IORedis({
  port: 6479,
});

export const WG_SEVER_PATH = `WG::SERVERS`;
