import { VerifyType } from '../enum/verify-type.enum';

export class GenerateVerityTokenDto {
  userAccountId!: number;
  type!: VerifyType;
}
