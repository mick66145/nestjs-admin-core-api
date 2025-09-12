import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserAccountModule } from 'src/user-account/user-account.module';
import { E8dSmsService } from './e8d-sms.service';
// import { E8dSmsController } from './e8d-sms.controller';

@Module({
  imports: [HttpModule, UserAccountModule],
  // controllers: [E8dSmsController],
  providers: [E8dSmsService],
  exports: [E8dSmsService],
})
export class E8dSmsModule {}
