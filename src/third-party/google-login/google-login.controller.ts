import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserEntity } from 'src/user/entities/user.entity';
import { GoogleLoginService } from './google-login.service';
import { GoogleLoginDto } from './dto/google-login.dto';

@ApiTags(`第三方登入`)
@Controller('google-login')
export class GoogleLoginController {
  constructor(private readonly googleLoginService: GoogleLoginService) {}

  @ApiOperation({ summary: '登入' })
  @ApiOkResponse({ type: UserEntity })
  @Post()
  login(@Body() dto: GoogleLoginDto) {
    return this.googleLoginService.login(dto);
  }
}
