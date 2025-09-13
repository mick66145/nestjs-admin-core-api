import { CreateVerificationDto } from 'src/verification/dto/verification.dto';
import { MessageSendMethod } from '../enum/message-send-method.enum';
import { VerifyType } from '../enum/verify-type.enum';

export class GenerateVerificationAndSendDto {
  userAccountId!: number;
  sendMethod!: MessageSendMethod;
  verifyType!: VerifyType;
  msg?: string;
  verificationOptions?: Partial<Omit<CreateVerificationDto, 'userAccountId'>>;
}
