import { Redis } from 'ioredis';

export type RedisClient = Redis;

let client: RedisClient | undefined;

export function getClient(): RedisClient {
  if (!client) {
    throw new Error('Redis client not initialized');
  }

  return client;
}

export function setClient(redis: RedisClient): void {
  client = redis;
}

if (process.env.NODE_ENV !== 'build') {
  setClient(
    new Redis({
      port: 6479,
    }),
  );
}
