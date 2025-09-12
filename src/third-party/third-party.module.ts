import { Module } from '@nestjs/common';
import { ThirdPartyService } from './third-party.service';
import { ThirdPartyController } from './third-party.controller';
import { E8dSmsModule } from './e8d-sms/e8d-sms.module';
import { GoogleMailModule } from './google-mail/google-mail.module';
import { GoogleLoginModule } from './google-login/google-login.module';
import { LineLoginModule } from './line-login/line-login.module';

@Module({
  imports: [E8dSmsModule, GoogleMailModule, GoogleLoginModule, LineLoginModule],
  controllers: [ThirdPartyController],
  providers: [ThirdPartyService],
})
export class ThirdPartyModule {}
