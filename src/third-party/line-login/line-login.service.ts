import { HttpService } from '@nestjs/axios';
import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { abortIf } from 'src/_libs/api-response/abort.util';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { dealWithPrismaClientError } from 'src/libs/prisma/client-error';
import { LineLoginConfigInterface } from 'src/config/third-party/third-party-config.interface';
import { AccountType } from 'src/user-account/user-account.interface';
import { UserAccountEntity } from 'src/user-account/entities/user-account.entity';
import { LineLoginWithOrgIdDto } from './dto/line-login.dto';

@Injectable()
export class LineLoginService {
  private readonly logger = new Logger(LineLoginService.name);
  private channelId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {
    const config = this.configService.getOrThrow<LineLoginConfigInterface>(
      'thirdParty.lineLogin',
    );
    this.channelId = config.channelId;
  }

  /**
   * https://developers.line.biz/en/docs/line-login/secure-login-process/#using-access-tokens
   */
  async login(dto: LineLoginWithOrgIdDto) {
    const { accessToken } = dto;
    await this.verifyToken(accessToken);
    const { userId } = await this.getUserProfile(accessToken);

    const now = new Date();
    const [user] = await this.prisma.userAccount.findFirstOrCreate({
      where: { account: userId! },
      data: {
        account: userId!,
        type: AccountType.Line,
        lastLoginAt: now,
      },
    });
    await this.prisma.userAccount
      .upsert({
        where: { id: user.id },
        create: {
          account: userId!,
          type: AccountType.Line,
          lastLoginAt: now,
        },
        update: { lastLoginAt: now },
      })
      .catch((err) => {
        dealWithPrismaClientError(err, 'LINE 登入帳號');
        throw err;
      });

    return plainToInstance(UserAccountEntity, user);
  }

  /**
   * https://developers.line.biz/en/reference/line-login/#verify-access-token
   */
  private async verifyToken(accessToken: string) {
    const name = 'verifyToken';
    const url = 'https://api.line.me/oauth2/v2.1/verify';
    const { data: result } = await this.httpService.axiosRef
      .get(url, { params: { access_token: accessToken } })
      .catch((err) => {
        const errStr =
          err?.message + ': ' + JSON.stringify(err?.response?.data);
        this.logger.warn(`${name}(${url}) error: ${errStr}`);
        throw new InternalServerErrorException(`${name} error`);
      });
    const { client_id, expires_in, scope } = result;
    abortIf(
      client_id !== this.channelId,
      `LINE Token 發行者錯誤`,
      HttpStatus.FORBIDDEN,
    );
    abortIf(expires_in <= 0, `LINE Token 已過期`, HttpStatus.FORBIDDEN);
    abortIf(
      !scope?.match('profile'),
      `LINE Token 權限不足(profile)`,
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * https://developers.line.biz/en/reference/line-login/#get-user-profile
   */
  async getUserProfile(accessToken: string) {
    const name = 'getUserProfile';
    const url = 'https://api.line.me/v2/profile';
    const { data: result } = await this.httpService.axiosRef
      .get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .catch((err) => {
        const errStr =
          err?.message + ': ' + JSON.stringify(err?.response?.data);
        this.logger.warn(`${name}(${url}) error: ${errStr}`);
        throw new InternalServerErrorException(`${name} error`);
      });
    const { userId } = result;
    abortIf(!userId, `取得 LINE profile 時出錯`, HttpStatus.UNAUTHORIZED);
    return result;
  }
}
