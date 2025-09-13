import { HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import dayjs from 'dayjs';
import isNil from 'lodash/isNil';
import { generateRandomString } from 'src/_libs/utils/helper/string-helper';
import { abortIf } from 'src/_libs/api-response/abort.util';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { dealWithPrismaClientError } from 'src/libs/prisma/client-error';
import { CodeType, entityName } from './verification.interface';
import { VerificationEntity } from './entities/verification.entity';
import { CreateVerificationDto, VerifyCodeDto } from './dto/verification.dto';

const codeTypeMap: {
  [key: string]: Parameters<typeof generateRandomString>[1];
} = {
  [CodeType.all]: ['ALL'],
  [CodeType.number]: ['NUMBER'],
  [CodeType.alphanumeric]: ['NUMBER', 'UPPER', 'LOWER'],
};

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVerificationDto) {
    const { userAccountId, length, codeType, expireMinutes } = dto;
    const user = await this.prisma.user.findFirst({
      where: { userAccountId },
    });
    abortIf(isNil(user), '無此帳號', HttpStatus.NOT_FOUND);

    const type = codeTypeMap[codeType];
    const code = generateRandomString(length, type);
    const expireAt = dayjs().add(expireMinutes, 'minute').toDate();

    try {
      const verification = await this.prisma.$transaction(async (tx) => {
        await tx.verification.updateMany({
          where: {
            userAccountId,
            isValid: true,
            usedAt: null,
            expireAt: { gt: new Date() },
          },
          data: { isValid: false },
        });
        return tx.verification.create({
          data: { userAccountId, code, expireAt },
        });
      });
      return plainToInstance(VerificationEntity, verification);
    } catch (err) {
      dealWithPrismaClientError(err, entityName);
      throw err;
    }
  }

  async verify(dto: VerifyCodeDto) {
    const { userAccountId, code } = dto;
    const verification = await this.prisma.verification.findFirst({
      where: { userAccountId, code, isValid: true, usedAt: null },
    });
    const now = new Date();
    abortIf(
      isNil(verification) || verification!.expireAt < now,
      '此驗證碼已過期或無效',
    );

    await this.prisma.verification.update({
      where: { id: verification!.id },
      data: { usedAt: now },
    });
  }
}
