import { Module } from '@nestjs/common';
import { GoogleLoginService } from './google-login.service';
// import { GoogleLoginController } from './google-login.controller';

@Module({
  // controllers: [GoogleLoginController],
  providers: [GoogleLoginService],
  exports: [GoogleLoginService],
})
export class GoogleLoginModule {}
