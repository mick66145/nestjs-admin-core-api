import { Module } from '@nestjs/common';
import { GoogleMailService } from './google-mail.service';
// import { GoogleMailController } from './google-mail.controller';
import { UserAccountModule } from 'src/user-account/user-account.module';

@Module({
  imports: [UserAccountModule],
  // controllers: [GoogleMailController],
  providers: [GoogleMailService],
  exports: [GoogleMailService],
})
export class GoogleMailModule {}
