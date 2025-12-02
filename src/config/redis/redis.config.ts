import { registerAs } from '@nestjs/config';
import { RedisConfigInterface } from './redis-config.interface';

export default registerAs(
  'redis',
  (): RedisConfigInterface => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  }),
);
