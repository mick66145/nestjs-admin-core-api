import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { ScheduleModule } from '@nestjs/schedule';
import { configLoads } from './config';
import { LoggerModule } from './_libs/logger/logger.module';
import { LoggerMiddleware } from './_libs/logger/logger.middleware';
import { PrismaModule } from './_libs/prisma/prisma.module';
import { AppController } from './app.controller';
import { UserAccountModule } from './user-account/user-account.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configLoads,
    }), // ref: https://docs.nestjs.com/techniques/configuration
    // ScheduleModule.forRoot(), // ref: https://docs.nestjs.com/techniques/task-scheduling
    LoggerModule,
    PrismaModule,
    UserAccountModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
