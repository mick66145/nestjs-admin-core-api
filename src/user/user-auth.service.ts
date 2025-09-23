import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { generateRandomString } from 'src/_libs/utils/helper/string-helper';
import { abort } from 'src/_libs/api-response/abort.util';
import { JwtConfigInterface } from 'src/_libs/auth/jwt-config.interface';
import { VerificationService } from 'src/verification/verification.service';
import { CodeType } from 'src/verification/verification.interface';
import { E8dSmsService } from 'src/third-party/e8d-sms/e8d-sms.service';
import { GoogleMailService } from 'src/third-party/google-mail/google-mail.service';
import { GoogleLoginService } from 'src/third-party/google-login/google-login.service';
import { LineLoginService } from 'src/third-party/line-login/line-login.service';
import { UserAccountService } from 'src/user-account/user-account.service';
import { UserAccountEntity } from 'src/user-account/entities/user-account.entity';
import { VerifyTokenService } from './verify-token.service';
import { VerifyWithTypeDto } from './dto/verify.dto';
import { GenerateVerificationAndSendDto } from './dto/generate-verification-and-send.dto';
import {
  SignPayload,
  JwtPayload,
  ThirtPartyPayload,
} from './user-auth.interface';
import { VerifyType } from './enum/verify-type.enum';
import { RegisterWithOrgIdDto } from './dto/register.dto';
import { ThirdPartyLoginWithOrgIdDto } from './dto/third-party-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ThirdPartyLoginType } from './enum/third-party-login-type.enum';
import { TokenEntity } from './entities/token.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserAuthService {
  private readonly logger = new Logger(UserAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly verifyTokenService: VerifyTokenService,
    private readonly userAccountService: UserAccountService,
    private readonly verificationService: VerificationService,
    private readonly e8dSmsService: E8dSmsService,
    private readonly googleMailService: GoogleMailService,
    private readonly googleLoginService: GoogleLoginService,
    private readonly lineLoginService: LineLoginService,
  ) {}

  protected async getToken(payload: SignPayload) {
    const { expires } =
      this.configService.getOrThrow<JwtConfigInterface>('jwt');

    return await this.jwtService.signAsync(payload, { expiresIn: expires });
  }

  /**
   * 註冊後台使用者(需進行驗證)
   */
  async registerWithVerification(registerWithOrgIdDto: RegisterWithOrgIdDto) {
    const { account, password, name, phone, email } = registerWithOrgIdDto;

    try {
      return this.prisma.$transaction(async (tx) => {
        // 1. 建立帳號
        const getUser = async (account: string) =>
          (await this.userAccountService.existsByAccount(account))
            ? await this.userAccountService.findByAccount(account)
            : await this.userAccountService.create({
                account,
                password,
              });

        const userAccount = await getUser(account);

        // 2. 建立後台使用者
        const data: Prisma.UserCreateInput = {
          phone,
          email,
          name,
          userAccount: { connect: { id: userAccount.id } },
        };
        let user = await tx.user.findFirst({
          where: { userAccountId: userAccount.id },
        });

        if (user) {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              phone,
              email,
              name,
            },
          });
        } else {
          user = await tx.user.create({
            data: data,
          });
        }

        // 2.1 生成註冊驗證用token
        const token = generateRandomString(64, ['LOWER', 'NUMBER']);
        await tx.verifyToken.findFirstOrCreate({
          where: { userAccountId: userAccount.id, type: VerifyType.REGISTER },
          data: {
            type: VerifyType.REGISTER,
            token,
            userAccountId: userAccount.id,
          },
        });

        return user;
      });
    } catch (err) {
      this.logger.error('後台使用者建立失敗', err);
      throw err;
    }
  }

  /**
   * 註冊後台使用者(無需驗證)
   */
  register(registerWithOrgIdDto: RegisterWithOrgIdDto) {
    const { account, password, name, phone, email } = registerWithOrgIdDto;

    try {
      return this.prisma.$transaction(async (tx) => {
        // 1. 建立帳號
        const getUser = async (account: string) =>
          (await this.userAccountService.existsByAccount(account))
            ? await this.userAccountService.findByAccount(account)
            : await this.userAccountService.create({
                account,
                password,
              });

        const userAccount = await getUser(account);

        // 2. 建立後台使用者
        const data: Prisma.UserCreateInput = {
          phone,
          email,
          name,
          isValid: true,
          isEnabled: true,
          userAccount: { connect: { id: userAccount.id } },
        };
        const user = await tx.user.create({ data });

        return user;
      });
    } catch (err) {
      this.logger.error('後台使用者建立失敗', err);
      throw err;
    }
  }

  /**
   * 生成驗證碼並發送
   */
  async generateVerificationAndSend(
    generateVerificationAndSendDto: GenerateVerificationAndSendDto,
  ) {
    const { userAccountId, sendMethod, verifyType, verificationOptions } =
      generateVerificationAndSendDto;
    let { msg } = generateVerificationAndSendDto;

    // 1. 取得user
    const userAccount = await this.userAccountService.findOne(userAccountId);
    const user = await this.prisma.user.findFirst({
      where: { userAccountId },
    });

    if (user === null) {
      abort('找無此後台使用者');
    }

    // 2. 生成驗證碼
    const generateVerification = async () => {
      const { codeType, expireMinutes, length } = verificationOptions ?? {};
      return await this.verificationService.create({
        codeType: codeType ?? CodeType.number,
        expireMinutes: expireMinutes ?? 10,
        length: length ?? 6,
        userAccountId: userAccount.id,
      });
    };
    const verification = await generateVerification();

    // 3. 發送訊息
    const getMsg = () => {
      switch (verifyType) {
        case 'register':
          msg = msg ?? `您的驗證碼為${verification.code}，請於10分鐘內進行驗證`;
          break;
        case 'forgetPassword':
          msg = msg ?? `您的驗證碼為${verification.code}，請於10分鐘內進行驗證`;
          break;
        default:
          abort('無效的驗證類型');
      }

      return msg;
    };

    const getSubject = () => {
      let subject = '';
      switch (verifyType) {
        case 'register':
          subject = `後台使用者註冊驗證碼`;
          break;
        case 'forgetPassword':
          subject = `後台使用者忘記密碼驗證碼`;
          break;
        default:
          abort('無效的驗證類型');
      }

      return subject;
    };

    const toSend = async () => {
      switch (sendMethod) {
        case 'email':
          if (user.email) {
            await this.googleMailService.sendMail({
              message: getMsg(),
              subject: getSubject(),
              to: user.email,
              userAccountId: userAccount.id,
            });
          } else {
            abort('發送失敗，尚未設定email');
          }
          break;
        case 'sms':
          if (user.phone) {
            await this.e8dSmsService.sendSms({
              MSG: getMsg(),
              DEST: user.phone,
              SB: getSubject(),
              ST: '',
              userAccountId: userAccount.id,
            });
          } else {
            abort('發送失敗，尚未設定手機號碼');
          }
          break;
        default:
          abort('無效的發送方式');
      }
    };

    await toSend();
  }

  /**
   * 檢查帳號是否存在
   */
  async checkAccountExists(account: string) {
    const getUser = async (account: string) =>
      (await this.userAccountService.existsByAccount(account))
        ? await this.userAccountService.findByAccount(account)
        : null;

    const userAccount = await getUser(account);
    const user = userAccount
      ? await this.prisma.user.findFirst({
          where: { userAccountId: userAccount.id },
        })
      : null;

    if (user && user?.isValid) {
      abort('此帳號已存在');
    }
  }

  /**
   * 檢查驗證碼
   */
  async verify(verifyDto: VerifyWithTypeDto) {
    const { code, token, type } = verifyDto;

    // 驗證token
    const verifyToken = await this.verifyTokenService.findOrThrow({
      token,
      type,
    });

    // 檢查驗證碼
    await this.verificationService.verify({
      userAccountId: verifyToken.userAccountId,
      code,
    });
  }

  async findUserByVerifyTokenOrThrow(token: string, verifyType: VerifyType) {
    const verifyToken = await this.verifyTokenService.findOrThrow({
      token,
      type: verifyType,
    });

    if (verifyToken === null) {
      abort('找無此驗證token');
    }

    return this.prisma.user.findFirstOrThrow({
      where: { userAccountId: verifyToken.userAccountId },
    });
  }

  /**
   * 第三方登入註冊
   */
  async thirdPartyLogin(
    thirdPartyLoginWithOrgIdDto: ThirdPartyLoginWithOrgIdDto,
  ) {
    const { type, token, platform, orgId = 0 } = thirdPartyLoginWithOrgIdDto;

    const getUserAccount = async () => {
      let userAccount: UserAccountEntity;

      switch (type) {
        case ThirdPartyLoginType.GOOGLE:
          if (platform === undefined) {
            abort('platform不可為空');
          }

          userAccount = await this.googleLoginService.login({
            platform,
            idToken: token,
            orgId,
          });
          break;
        case ThirdPartyLoginType.LINE:
          userAccount = await this.lineLoginService.login({
            accessToken: token,
            orgId,
          });
          break;
        default:
          abort('不合法的登入方式');
      }

      return userAccount;
    };

    const getPayload = async (): Promise<ThirtPartyPayload> => {
      let payload: ThirtPartyPayload;

      switch (type) {
        case ThirdPartyLoginType.GOOGLE:
          if (platform === undefined) {
            abort('platform不可為空');
          }

          const { name, email } =
            (await this.googleLoginService.getPayload({
              platform,
              idToken: token,
            })) ?? {};

          payload = {
            name: name ?? '系統產生',
            email: email,
          };

          break;
        case ThirdPartyLoginType.LINE:
          const { displayName } =
            (await this.lineLoginService.getUserProfile(token)) ?? {};

          payload = {
            name: displayName ?? '系統產生',
          };
          break;
        default:
          abort('不合法的登入方式');
      }

      return payload;
    };

    try {
      return this.prisma.$transaction(async (tx) => {
        // 1. 取得或建立帳號
        const userAccount = await getUserAccount();

        // 2. 建立後台使用者
        const { name, email, phone } = await getPayload();
        const data: Prisma.UserCreateInput = {
          phone,
          email,
          name,
          isValid: true,
          userAccount: { connect: { id: userAccount.id } },
        };
        const [user] = await tx.user.findFirstOrCreate({
          where: { userAccountId: userAccount.id },
          data,
        });

        return user;
      });
    } catch (err) {
      this.logger.error('後台使用者建立或登入失敗', err);
      throw err;
    }
  }

  /**
   * 生成登入token
   */
  async getJwtToken(params: { userAccountId: number }) {
    const { userAccountId } = params;

    const user = await this.prisma.user.findFirst({
      where: { userAccountId },
    });

    if (user === null) {
      abort('找無此後台使用者');
    }

    const { refreshExpires } =
      this.configService.getOrThrow<JwtConfigInterface>('jwt');

    const token = await this.getToken({
      sub: user.userAccountId.toString(),
      username: user.name,
      refreshExp:
        refreshExpires === 0
          ? 0
          : ((new Date().getTime() / 1000) | 0) + refreshExpires,
    });

    return token;
  }

  async refreshJwtToken(refreshTokenDto: RefreshTokenDto) {
    const { token } = refreshTokenDto;

    await this.verifyJwtTokenOrThrow(token, { ignoreExpiration: true });

    const { sub, username, refreshExp } = await this.getJwtPayload(token, {
      ignoreExpiration: true,
    });

    if (refreshExp !== 0 && refreshExp < ((new Date().getTime() / 1000) | 0)) {
      abort('刷新時效已過期', HttpStatus.UNAUTHORIZED);
    }

    const newToken = await this.getToken({
      sub,
      username,
      refreshExp,
    });

    return newToken;
  }

  async verifyJwtToken(token: string, options?: JwtVerifyOptions) {
    try {
      this.jwtService.verify(token, options);
    } catch (err) {
      return false;
    }

    return true;
  }

  async verifyJwtTokenOrThrow(token: string, options?: JwtVerifyOptions) {
    const isValid = await this.verifyJwtToken(token, options);

    if (!isValid) {
      abort('Token已過期或無效', HttpStatus.UNAUTHORIZED);
    }

    return isValid;
  }

  async getJwtPayload(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<JwtPayload> {
    return this.jwtService.verify<JwtPayload>(token, options);
  }

  async getTokenEntity(token: string): Promise<TokenEntity> {
    const { iat, exp, refreshExp } = await this.getJwtPayload(token);

    return plainToInstance(TokenEntity, {
      iat,
      exp,
      refreshExp,
      token,
    });
  }

  async getProfile(token: string): Promise<UserEntity> {
    const { sub } = await this.getJwtPayload(token);
    const user = await this.prisma.user.findFirst({
      where: { userAccountId: parseInt(sub) },
      include: {
        userAccount: true,
      },
    });

    if (user === null) {
      abort('找無此後台使用者');
    }

    return plainToInstance(UserEntity, user);
  }
}
