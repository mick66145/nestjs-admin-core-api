import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import nodemailer, { SendMailOptions } from 'nodemailer';
import { abortIf } from 'src/_libs/api-response/abort.util';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { dealWithPrismaClientError } from 'src/libs/prisma/client-error';
import { GoogleMailConfigInterface } from 'src/config/third-party/third-party-config.interface';
import { UserAccountService } from 'src/user-account/user-account.service';
import { entityName } from './google-mail.interface';
import { SendMailLogEntity } from './entities/mail.entity';
import { SendMailDto } from './dto/send-mail.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';

@Injectable()
export class GoogleMailService {
  private readonly logger = new Logger(GoogleMailService.name);
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly userAccountService: UserAccountService,
  ) {
    const {
      smtp: { host, port },
      email: user,
      password: pass,
    } = this.configService.getOrThrow<GoogleMailConfigInterface>(
      'thirdParty.googleMail',
    );
    const options = { host, port, auth: { user, pass } };
    this.transporter = nodemailer.createTransport(options);
    this.from = user;
  }

  async sendMail(dto: SendMailDto) {
    const { userAccountId } = dto;
    await this.userAccountService.findOne(userAccountId);

    const name = 'sendMail';
    const { to, subject, message } = dto;
    const mailOptions: SendMailOptions = {
      from: this.from,
      to,
      subject,
      html: message,
    };
    await this.transporter.sendMail(mailOptions).catch((err) => {
      const errStr = err?.message + ': ' + JSON.stringify(err?.response?.data);
      this.logger.warn(`${name} error: ${errStr}`);
      throw new InternalServerErrorException(`${name} error`);
    });

    const log = await this.prisma.sendMailLog
      .create({ data: { userAccountId, subject, to } })
      .catch((err) => {
        dealWithPrismaClientError(err, entityName);
        throw err;
      });
    return plainToInstance(SendMailLogEntity, log);
  }

  async findAll(query: FindAllQueryDto) {
    const { page, limit, ids, userAccountId } = query;
    const where: Prisma.SendMailLogWhereInput = { userAccountId };
    if (ids?.length) where.id = { in: ids };

    const { result, ...meta } = await this.prisma.sendMailLog.pagination({
      page,
      limit,
      where,
      orderBy: { id: 'asc' },
    });
    return {
      data: plainToInstance(SendMailLogEntity, result),
      meta,
    };
  }

  async findOne(id: number) {
    const log = await this.prisma.sendMailLog.findFirst({
      where: { id },
    });
    abortIf(!log, `無此${entityName}`, HttpStatus.NOT_FOUND);
    return plainToInstance(SendMailLogEntity, log);
  }
}
