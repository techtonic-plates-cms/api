import {Redis} from 'ioredis';

export const redis = new Redis({
  host: Deno.env.get('REDIS_HOST') || 'localhost',
  port: Number(Deno.env.get('REDIS_PORT')) || 6379,
  password: Deno.env.get('REDIS_PASSWORD') || '',
});