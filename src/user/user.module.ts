import { Module } from '@nestjs/common';
import { UserAccountModule } from 'src/user-account/user-account.module';
import { VerificationModule } from 'src/verification/verification.module';
import { E8dSmsModule } from 'src/third-party/e8d-sms/e8d-sms.module';
import { GoogleMailModule } from 'src/third-party/google-mail/google-mail.module';
import { GoogleLoginModule } from 'src/third-party/google-login/google-login.module';
import { LineLoginModule } from 'src/third-party/line-login/line-login.module';
import { UserAuthService } from './user-auth.service';
import { UserService } from './user.service';
import { UserAuthController } from './user-auth.controller';
import { UserController } from './user.controller';
import { VerifyTokenService } from './verify-token.service';
import { RoleModule } from 'src/role/role.module';

@Module({
  imports: [
    UserAccountModule,
    VerificationModule,
    E8dSmsModule,
    GoogleMailModule,
    GoogleLoginModule,
    LineLoginModule,
    RoleModule,
  ],
  controllers: [UserAuthController, UserController],
  providers: [UserAuthService, UserService, VerifyTokenService],
  exports: [UserAuthService, UserService],
})
export class UserModule {}
