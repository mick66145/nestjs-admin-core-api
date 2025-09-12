import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { GoogleOAuth2Platform } from '../google-login.interface';

export class BaseGoogleOAuth2Dto {
  @ApiProperty({ enum: GoogleOAuth2Platform, description: '要驗證的平台' })
  @IsEnum(GoogleOAuth2Platform)
  platform!: GoogleOAuth2Platform;
}

export class GoogleLoginDto extends BaseGoogleOAuth2Dto {
  @ApiProperty({ description: '要驗證的 token' })
  @IsNotEmpty()
  @IsString()
  idToken!: string;
}

export class GoogleLoginWithOrgIdDto extends GoogleLoginDto {
  orgId?: number;
}

export class GetPayloadDto extends BaseGoogleOAuth2Dto {
  @ApiProperty({ description: '要驗證的 token' })
  @IsNotEmpty()
  @IsString()
  idToken!: string;
}
