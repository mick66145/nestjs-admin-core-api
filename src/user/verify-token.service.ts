import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { abort } from 'src/_libs/api-response/abort.util';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { XOR } from 'src/_libs/utils/interface/common.type';
import { generateRandomString } from 'src/_libs/utils/helper/string-helper';
import { GenerateVerityTokenDto } from './dto/generate-verity-token.dto';
import { VerifyType } from './enum/verify-type.enum';

@Injectable()
export class VerifyTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(generateVerityTokenDto: GenerateVerityTokenDto) {
    const { type, userAccountId } = generateVerityTokenDto;
    const token = generateRandomString(64, ['LOWER', 'NUMBER']);
    const [verifyToken] = await this.prisma.verifyToken.findFirstOrCreate({
      where: { userAccountId, type },
      data: { userAccountId, type, token },
    });

    return verifyToken;
  }

  async findOrThrow(
    params: XOR<
      {
        userAccountId: number;
        type: VerifyType;
      },
      { token: string; type: VerifyType }
    >,
  ) {
    const { userAccountId, token, type } = params;

    const verifyToken = await this.prisma.verifyToken.findFirst({
      where: { userAccountId, token, type },
    });

    if (verifyToken === null) {
      abort('找無此驗證token', HttpStatus.NOT_FOUND);
    }

    return verifyToken;
  }

  async delete(where: Prisma.VerifyTokenWhereUniqueInput) {
    return this.prisma.verifyToken.delete({ where });
  }
}
