import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Put,
  Logger,
  HttpException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { abort } from 'src/_libs/api-response/abort.util';
import { UserAccountService } from 'src/user-account/user-account.service';
import { UpdatePasswordDto } from 'src/user-account/dto/user-account.dto';
import { AuthDataConfig } from './user-auth.interface';
import { MessageSendMethod } from './enum/message-send-method.enum';
import { VerifyType } from './enum/verify-type.enum';
import { UserAuthService } from './user-auth.service';
import { VerifyTokenService } from './verify-token.service';
import { AuthData } from './decorators/auth-data.decorator';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerifyDto, VerifyDto } from './dto/verify.dto';
// import { ThirdPartyLoginDto } from './dto/third-party-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshTokenDto, VerifyTokenDto } from './dto/refresh-token.dto';
import {
  ForgetPasswordResendDto,
  ForgetPasswordResetDto,
  ForgetPasswordTokenDto,
  ForgetPasswordVerifyDto,
} from './dto/forget-password.dto';
import { TokenEntity } from './entities/token.entity';
import { RegisterEntity } from './entities/register.entity';
import { ProfileEntity } from './entities/profile.entity';
import { UseAuth } from './decorators/use-auth.decorator';
import {
  ForgetPasswordEntity,
  ForgetPasswordVerifyEntity,
} from './entities/forget-password.entity';
import { ForgetPasswordSendMethod } from './enum/forget-password-send-method.enum';

@ApiTags('總後台管理員')
@Controller('user-auth')
export class UserAuthController {
  private readonly logger = new Logger(UserAuthController.name);

  constructor(
    private readonly userAccountService: UserAccountService,
    private readonly userAuthService: UserAuthService,
    private readonly userService: UserService,
    private readonly verifyTokenService: VerifyTokenService,
  ) {}

  @ApiOperation({ summary: '管理員註冊' })
  @ApiOkResponse({ type: RegisterEntity })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { account } = registerDto;

    const orgId = 0;

    // 1. 檢查帳號是否已存在
    await this.userAuthService.checkAccountExists(account);

    // 2. 建立管理員
    const user = await this.userAuthService.registerWithVerification({
      ...registerDto,
      orgId,
    });

    // 3. 發送驗證碼
    await this.userAuthService.generateVerificationAndSend({
      userAccountId: user.userAccountId,
      verifyType: VerifyType.REGISTER,
      sendMethod: MessageSendMethod.EMAIL,
    });

    const verifyToken = await this.verifyTokenService.findOrThrow({
      userAccountId: user.userAccountId,
      type: VerifyType.REGISTER,
    });

    return plainToInstance(RegisterEntity, {
      ...user,
      token: verifyToken.token,
    });
  }

  @ApiOperation({ summary: '重新發送註冊驗證碼' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('resend-register-code')
  async resendRegisterCode(@Body() resendVerifyDto: ResendVerifyDto) {
    const { token } = resendVerifyDto;

    // 1. 檢查驗證Token
    const verityToken = await this.verifyTokenService.findOrThrow({
      token,
      type: VerifyType.REGISTER,
    });

    // 2. 發送驗證碼
    await this.userAuthService.generateVerificationAndSend({
      userAccountId: verityToken.userAccountId,
      verifyType: VerifyType.REGISTER,
      sendMethod: MessageSendMethod.EMAIL,
    });
  }

  @ApiOperation({ summary: '驗證註冊驗證碼' })
  @ApiOkResponse({ type: TokenEntity })
  @Post('verify')
  async verify(@Body() verifyDto: VerifyDto) {
    const { token: verifyToken } = verifyDto;

    // 1. 檢查註冊驗證碼
    await this.userAuthService.verify({
      ...verifyDto,
      type: VerifyType.REGISTER,
    });

    // 2. 取得管理員資訊
    const user = await this.userAuthService.findUserByVerifyTokenOrThrow(
      verifyToken,
      VerifyType.REGISTER,
    );

    // 3. 更新管理員資訊
    await this.userService.update(
      { userAccountId: user.userAccountId },
      {
        isValid: true,
      },
    );

    // 4. 取得登入Token
    const token = await this.userAuthService.getJwtToken({
      userAccountId: user.userAccountId,
    });

    return this.userAuthService.getTokenEntity(token);
  }

  @ApiOperation({ summary: '管理員登入' })
  @ApiOkResponse({ type: TokenEntity })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { account, password } = loginDto;

    // 1. 取得管理員資訊，並檢查管理員是否啟用
    const getUser = async () => {
      try {
        return await this.userService.findByAccountOrThrow({
          account,
        });
      } catch {
        abort('帳號或密碼錯誤', HttpStatus.UNAUTHORIZED);
      }
    };

    const user = await getUser();

    if (!user.isEnabled) {
      abort('管理員尚未啟用，無法登入', HttpStatus.FORBIDDEN);
    }

    // 2. 登入驗證
    const userAccount = await this.userAccountService.login({
      account,
      password,
    });

    const token = await this.userAuthService.getJwtToken({
      userAccountId: userAccount.id,
    });

    return this.userAuthService.getTokenEntity(token);
  }

  // @ApiOperation({ summary: '第三方會員登入' })
  // @ApiOkResponse({ type: TokenEntity })
  // @Post('third-party-login')
  // async thirdPartyLogin(@Body() thirdPartyLoginDto: ThirdPartyLoginDto) {
  //   const orgId = 0;

  //   // 1. 建立管理員
  //   const user = await this.userAuthService.thirdPartyLogin({
  //     ...thirdPartyLoginDto,
  //     orgId,
  //   });

  //   // 2. 取得登入token
  //   const token = await this.userAuthService.getJwtToken({
  //     userAccountId: user.userAccountId,
  //   });

  //   return this.userAuthService.getTokenEntity(token);
  // }

  @ApiOperation({ summary: '取得登入者資訊' })
  @UseAuth()
  @ApiOkResponse({ type: ProfileEntity })
  @Get('profile')
  async getProfile(@AuthData() authData: AuthDataConfig) {
    const { payload } = authData;

    const user = await this.userService.findOne(
      {
        userAccountId: parseInt(payload.sub),
      },
      {
        userAccount: true,
      },
    );

    return plainToInstance(ProfileEntity, user);
  }

  @ApiOperation({ summary: '更新登入者資訊' })
  @UseAuth()
  @ApiOkResponse({ type: ProfileEntity })
  @Put('profile')
  async updateProfile(
    @AuthData() authData: AuthDataConfig,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const { payload } = authData;

    const user = await this.userService.update(
      {
        userAccountId: parseInt(payload.sub),
      },
      updateProfileDto,
      {
        userAccount: true,
      },
    );

    return plainToInstance(ProfileEntity, user);
  }

  @ApiOperation({ summary: '更新登入者密碼' })
  @UseAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('change-password')
  async changePassword(
    @AuthData() authData: AuthDataConfig,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const { payload } = authData;

    await this.userAccountService.updatePassword(
      parseInt(payload.sub),
      updatePasswordDto,
    );
  }

  @ApiOperation({ summary: '驗證Token' })
  @ApiOkResponse({ type: TokenEntity })
  @Post('verify-token')
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    const { token } = verifyTokenDto;

    await this.userAuthService.verifyJwtTokenOrThrow(token);

    return this.userAuthService.getTokenEntity(token);
  }

  @ApiOperation({ summary: '刷新Token' })
  @ApiOkResponse({ type: TokenEntity })
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const newToken =
      await this.userAuthService.refreshJwtToken(refreshTokenDto);

    return this.userAuthService.getTokenEntity(newToken);
  }

  @ApiOperation({ summary: '忘記密碼-取得驗證碼' })
  @ApiOkResponse({ type: ForgetPasswordEntity })
  @Post('forget-password-token')
  async forgetPasswordToken(
    @Body() forgetPasswordTokenDto: ForgetPasswordTokenDto,
  ) {
    const { method, target } = forgetPasswordTokenDto;

    // 1. 驗證管理員資料
    const targetWhere = () => {
      if (method === ForgetPasswordSendMethod.EMAIL) {
        return { email: target };
      } else {
        return { phone: target };
      }
    };

    const user = await this.userService.findFirstOrThrow({
      ...targetWhere(),
    });

    // 2. 產生並發送忘記密碼驗證碼
    try {
      const verifyToken = await this.verifyTokenService.create({
        type: VerifyType.FORGET_PASSWORD,
        userAccountId: user.userAccountId,
      });

      await this.userAuthService.generateVerificationAndSend({
        userAccountId: user.userAccountId,
        sendMethod:
          method === ForgetPasswordSendMethod.EMAIL
            ? MessageSendMethod.EMAIL
            : MessageSendMethod.SMS,
        verifyType: VerifyType.FORGET_PASSWORD,
      });

      return plainToInstance(ForgetPasswordEntity, {
        token: verifyToken.token,
      });
    } catch (err) {
      this.logger.error((err as Error).message, (err as Error).stack);
      if (err instanceof HttpException) throw err;
      abort('忘記密碼驗證碼發送失敗');
    }
  }

  @ApiOperation({ summary: '忘記密碼-重新發送驗證碼' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('forget-password-resend')
  async forgetPasswordResend(
    @Body() forgetPasswordResendDto: ForgetPasswordResendDto,
  ) {
    const { method, token } = forgetPasswordResendDto;

    // 1. 檢查驗證Token
    const verifyToken = await this.verifyTokenService.findOrThrow({
      token,
      type: VerifyType.FORGET_PASSWORD,
    });

    // 2. 重新產生並發送驗證碼
    try {
      await this.userAuthService.generateVerificationAndSend({
        userAccountId: verifyToken.userAccountId,
        sendMethod:
          method === ForgetPasswordSendMethod.EMAIL
            ? MessageSendMethod.EMAIL
            : MessageSendMethod.SMS,
        verifyType: VerifyType.FORGET_PASSWORD,
      });
    } catch (err) {
      this.logger.error((err as Error).message, (err as Error).stack);
      if (err instanceof HttpException) throw err;
      abort('忘記密碼驗證碼發送失敗');
    }
  }

  @ApiOperation({ summary: '忘記密碼-驗證驗證碼' })
  @ApiOkResponse({ type: ForgetPasswordVerifyEntity })
  @HttpCode(HttpStatus.OK)
  @Post('forget-password-verify')
  async forgetPasswordVerify(
    @Body() forgetPasswordVerifyDto: ForgetPasswordVerifyDto,
  ) {
    const { token, code } = forgetPasswordVerifyDto;

    // 1. 檢查驗證Token和驗證碼
    const verifyToken = await this.verifyTokenService.findOrThrow({
      token,
      type: VerifyType.FORGET_PASSWORD,
    });

    await this.userAuthService.verify({
      code,
      token,
      type: VerifyType.FORGET_PASSWORD,
    });

    // 1.1 刪除驗證Token
    await this.verifyTokenService.delete({
      type_token: {
        token,
        type: VerifyType.FORGET_PASSWORD,
      },
    });

    // 2. 生成修改密碼驗證Token
    const resetVerifyToken = await this.verifyTokenService.create({
      type: VerifyType.FORGET_PASSWORD_RESET,
      userAccountId: verifyToken.userAccountId,
    });

    return plainToInstance(ForgetPasswordVerifyEntity, {
      token: resetVerifyToken.token,
    });
  }

  @ApiOperation({ summary: '忘記密碼-重置密碼' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('forget-password-reset')
  async forgetPasswordReset(
    @Body() forgetPasswordResetDto: ForgetPasswordResetDto,
  ) {
    const { token, password } = forgetPasswordResetDto;

    // 1. 檢查驗證Token
    const verifyToken = await this.verifyTokenService.findOrThrow({
      token,
      type: VerifyType.FORGET_PASSWORD_RESET,
    });

    // 2. 更新密碼
    await this.userAccountService.resetPassword(verifyToken.userAccountId, {
      newPassword: password,
    });

    // 3. 刪除驗證Token
    await this.verifyTokenService.delete({
      type_token: { token, type: VerifyType.FORGET_PASSWORD_RESET },
    });
  }
}
