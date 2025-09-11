import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
// import { ScheduleModule } from '@nestjs/schedule';
import { configLoads } from './config';
import { LoggerModule } from './_libs/logger/logger.module';
import { LoggerMiddleware } from './_libs/logger/logger.middleware';
import { PrismaModule } from './_libs/prisma/prisma.module';
import { JwtConfigInterface } from './_libs/auth/jwt-config.interface';
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
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => {
        const jwt = configService.getOrThrow<JwtConfigInterface>('jwt');

        return {
          secret: jwt.secret,
          signOptions: { expiresIn: jwt.expires },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
