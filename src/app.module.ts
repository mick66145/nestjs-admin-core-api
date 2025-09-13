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
import { VerificationModule } from './verification/verification.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './libs/permission/permission.module';
import { ThirdPartyModule } from './third-party/third-party.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configLoads,
    }), // ref: https://docs.nestjs.com/techniques/configuration
    // ScheduleModule.forRoot(), // ref: https://docs.nestjs.com/techniques/task-scheduling
    LoggerModule,
    PrismaModule,
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
    PermissionModule,
    ThirdPartyModule,
    UserAccountModule,
    VerificationModule,
    UserModule,
    RoleModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
