import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { UserEntity } from 'src/user/entities/user.entity';
import { LineLoginService } from './line-login.service';
import { LineLoginDto } from './dto/line-login.dto';

@ApiTags(`第三方登入`)
@Controller('line-login')
export class LineLoginController {
  constructor(private readonly lineLoginService: LineLoginService) {}

  @ApiOperation({ summary: '登入' })
  @ApiOkResponse({ type: UserEntity })
  @Post()
  login(@Body() dto: LineLoginDto) {
    return this.lineLoginService.login(dto);
  }
}
