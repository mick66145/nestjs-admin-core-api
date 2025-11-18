import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { abortIf } from 'src/_libs/api-response/abort.util';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { dealWithPrismaClientError } from 'src/_libs/prisma/prisma-client-error';
import { E8dConfigInterface } from 'src/config/third-party/third-party-config.interface';
import { entityName } from './e8d-sms.interface';
import { UserAccountService } from 'src/user-account/user-account.service';
import { SendSmsLogEntity } from './entities/e8d.entity';
import { SendSmsDto } from './dto/send-sms.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';

@Injectable()
export class E8dSmsService {
  private readonly logger = new Logger(E8dSmsService.name);
  private apiSite: string;
  private basicData: { UID: string; PWD: string };
  private headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: '*/*',
  };
  private readonly apiPath: Record<string, string> = {
    getCredit: 'API21/HTTP/GetCredit.ashx',
    sendSms: 'API21/HTTP/SendSMS.ashx',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly userAccountService: UserAccountService,
  ) {
    const { apiSite, UID, PWD } =
      this.configService.getOrThrow<E8dConfigInterface>('thirdParty.e8d');
    this.apiSite = apiSite;
    this.basicData = { UID, PWD };
  }

  /**
   * 查詢剩餘點數
   */
  async getCredit() {
    const name = 'getCredit';
    const url = `${this.apiSite}${this.apiPath[name]}`;
    const data = { ...this.basicData };
    const { data: result } = await this.httpService.axiosRef
      .post(url, data, { headers: this.headers })
      .catch((err) => {
        const errStr =
          err?.message + ': ' + JSON.stringify(err?.response?.data);
        this.logger.warn(`${name}(${url}) error: ${errStr}`);
        throw new InternalServerErrorException(`${name} error`);
      });
    this.logger.log(`${name} success: ${result}`);

    const resultData = result.toString().split(',');
    abortIf(resultData.length === 2, `${name} error: ${resultData}`);
    return { credit: parseFloat(resultData[0]) };
  }

  /**
   * 發送簡訊
   *
   * ---
   * - SB: 簡訊主旨，主旨不會隨著簡訊內容發送出去，用以註記本次發送之用途
   * - MSG: 簡訊內容
   * - DEST: 手機號碼
   * - ST: 預約時間，格式為yyyyMMddHHmmss，若要立即發送，請用空字串
   * - RETRYTIME: 有效期限
   */
  async sendSms(dto: SendSmsDto) {
    const { userAccountId, ...rest } = dto;
    await this.userAccountService.findOne(userAccountId);

    const name = 'sendSms';
    const url = `${this.apiSite}${this.apiPath[name]}`;
    const data = { ...this.basicData, ...rest };
    const { data: result } = await this.httpService.axiosRef
      .post(url, data, { headers: this.headers })
      .catch((err) => {
        const errStr =
          err?.message + ': ' + JSON.stringify(err?.response?.data);
        this.logger.warn(`${name}(${url}) error: ${errStr}`);
        throw new InternalServerErrorException(`${name} error`);
      });
    this.logger.log(`${name} success: ${result}`);

    const { SB: subject, DEST: destination, ST: sendTime } = dto;
    const log = await this.prisma.sendSmsLog
      .create({
        data: { userAccountId, subject, destination, sendTime, result },
      })
      .catch((err) => {
        dealWithPrismaClientError(err, entityName);
        throw err;
      });
    const resultData = result.toString().split(',');
    abortIf(resultData.length === 2, `${name} error: ${resultData}`);

    return plainToInstance(SendSmsLogEntity, log);
  }

  async findAll(query: FindAllQueryDto) {
    const { page, limit, ids, userAccountId } = query;
    const where: Prisma.SendSmsLogWhereInput = { userAccountId };
    if (ids?.length) where.id = { in: ids };

    const { result, ...meta } = await this.prisma.sendSmsLog.pagination({
      page,
      limit,
      where,
      orderBy: { id: 'asc' },
    });
    return {
      data: plainToInstance(SendSmsLogEntity, result),
      meta,
    };
  }

  async findOne(id: number) {
    const log = await this.prisma.sendSmsLog.findFirst({
      where: { id },
    });
    abortIf(!log, `無此${entityName}`, HttpStatus.NOT_FOUND);
    return plainToInstance(SendSmsLogEntity, log);
  }
}
