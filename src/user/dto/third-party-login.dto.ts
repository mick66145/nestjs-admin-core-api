import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ThirdPartyLoginType } from '../enum/third-party-login-type.enum';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { GoogleOAuth2Platform } from 'src/third-party/google-login/google-login.interface';

export class ThirdPartyLoginDto {
  @ApiProperty({ enum: ThirdPartyLoginType })
  @IsNotEmpty()
  @IsEnum(ThirdPartyLoginType)
  type!: ThirdPartyLoginType;

  @ApiPropertyOptional({
    description: 'google登入平台',
    enum: GoogleOAuth2Platform,
  })
  @ValidateIf((obj) => obj.type === ThirdPartyLoginType.GOOGLE)
  @IsNotEmpty({
    message: ({ property }) => `若登入方式為google，${property}不可為空`,
  })
  @IsEnum(GoogleOAuth2Platform)
  platform?: GoogleOAuth2Platform;

  @ApiProperty({ description: '第三方登入token' })
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class ThirdPartyLoginWithOrgIdDto extends ThirdPartyLoginDto {
  orgId?: number;
}
