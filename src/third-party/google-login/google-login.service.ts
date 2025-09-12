import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { OAuth2Client } from 'google-auth-library';
import { abortIf } from 'src/_libs/api-response/abort.util';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { dealWithPrismaClientError } from 'src/libs/prisma/client-error';
import { GoogleLoginConfigInterface } from 'src/config/third-party/third-party-config.interface';
import { AccountType } from 'src/user-account/user-account.interface';
import { UserAccountEntity } from 'src/user-account/entities/user-account.entity';
import { GoogleOAuth2Platform } from './google-login.interface';
import { GetPayloadDto, GoogleLoginWithOrgIdDto } from './dto/google-login.dto';

@Injectable()
export class GoogleLoginService {
  private clientIds: Record<GoogleOAuth2Platform, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const config = this.configService.getOrThrow<GoogleLoginConfigInterface>(
      'thirdParty.googleLogin',
    );
    this.clientIds = {
      [GoogleOAuth2Platform.web]: config.webClientId,
      [GoogleOAuth2Platform.ios]: config.iosClientId,
      [GoogleOAuth2Platform.android]: config.androidClientId,
    };
  }

  async login(dto: GoogleLoginWithOrgIdDto) {
    const { platform, idToken } = dto;
    const clientId = this.clientIds[platform];
    abortIf(
      !clientId,
      `不支援的驗證平台(${platform})`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    const oAuth2Client = new OAuth2Client(clientId);
    const loginTicket = await oAuth2Client
      .verifyIdToken({
        idToken,
        audience: clientId,
      })
      .catch((err) => {
        abortIf(
          err instanceof Error,
          `Google Token 驗證失敗(${err.message})`,
          HttpStatus.FORBIDDEN,
        );
        throw err;
      });

    const userId = loginTicket.getUserId();
    abortIf(
      !userId,
      `Google Token 權限不足，無法獲取 userAccountId`,
      HttpStatus.UNAUTHORIZED,
    );

    const now = new Date();
    const [user] = await this.prisma.userAccount.findFirstOrCreate({
      where: { account: userId! },
      data: {
        account: userId!,
        type: AccountType.Google,
        lastLoginAt: now,
      },
    });
    await this.prisma.userAccount
      .upsert({
        where: { id: user.id },
        create: {
          account: userId!,
          type: AccountType.Google,
          lastLoginAt: now,
        },
        update: { lastLoginAt: now },
      })
      .catch((err) => {
        dealWithPrismaClientError(err, 'Google 登入帳號');
        throw err;
      });

    return plainToInstance(UserAccountEntity, user);
  }

  async getPayload(dto: GetPayloadDto) {
    const { platform, idToken } = dto;
    const clientId = this.clientIds[platform];
    abortIf(
      !clientId,
      `不支援的驗證平台(${platform})`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    const oAuth2Client = new OAuth2Client(clientId);
    const loginTicket = await oAuth2Client
      .verifyIdToken({
        idToken,
        audience: clientId,
      })
      .catch((err) => {
        abortIf(
          err instanceof Error,
          `Google Token 驗證失敗(${err.message})`,
          HttpStatus.FORBIDDEN,
        );
        throw err;
      });

    return loginTicket.getPayload();
  }
}
