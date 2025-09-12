import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LineLoginService } from './line-login.service';
// import { LineLoginController } from './line-login.controller';

@Module({
  imports: [HttpModule],
  // controllers: [LineLoginController],
  providers: [LineLoginService],
  exports: [LineLoginService],
})
export class LineLoginModule {}
