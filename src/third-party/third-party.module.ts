import { Global, Module } from '@nestjs/common';
import { E8dSmsModule } from './e8d-sms/e8d-sms.module';
import { GoogleLoginModule } from './google-login/google-login.module';
import { GoogleMailModule } from './google-mail/google-mail.module';
import { LineLoginModule } from './line-login/line-login.module';
import { ThirdPartyController } from './third-party.controller';
import { ThirdPartyService } from './third-party.service';

@Global()
@Module({
  imports: [E8dSmsModule, GoogleLoginModule, GoogleMailModule, LineLoginModule],
  controllers: [ThirdPartyController],
  providers: [ThirdPartyService],
  exports: [E8dSmsModule, GoogleLoginModule, GoogleMailModule, LineLoginModule],
})
export class ThirdPartyModule {}
