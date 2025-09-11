import { registerAs } from '@nestjs/config';
import { CodeType } from 'src/verification/verification.interface';
import { VerificationConfigInterface } from './verification-config.interface';

export const token = 'verification';
export const configFactory = (): VerificationConfigInterface => ({
  codeLength: parseInt(process.env.VERIFICATION_CODE_LENGTH ?? '', 10) || 6,
  codeType: CodeType.number,
  expireMinutes:
    parseInt(process.env.VERIFICATION_EXPIRE_MINUTES ?? '', 10) || 10,
});

export default registerAs(token, configFactory);
