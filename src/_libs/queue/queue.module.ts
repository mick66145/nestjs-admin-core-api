import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { RedisConfigInterface } from 'src/config/redis/redis-config.interface';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redis = configService.get<RedisConfigInterface>('redis');
        return {
          connection: {
            host: redis?.host || 'localhost',
            port: redis?.port || 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
