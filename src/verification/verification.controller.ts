import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { entityName } from './verification.interface';
import { VerificationService } from './verification.service';
import { VerificationEntity } from './entities/verification.entity';
import { CreateVerificationDto, VerifyCodeDto } from './dto/verification.dto';

@ApiTags(`${entityName}管理`)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @ApiOperation({ summary: '產生驗證碼' })
  @ApiOkResponse({ type: VerificationEntity })
  @Post()
  create(@Body() dto: CreateVerificationDto) {
    return this.verificationService.create(dto);
  }

  @ApiOperation({ summary: '驗證驗證碼' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('verify')
  async verify(@Body() dto: VerifyCodeDto) {
    await this.verificationService.verify(dto);
  }
}
