import { CodeType } from 'src/verification/verification.interface';

export interface VerificationConfigInterface {
  codeLength: number;
  codeType: CodeType;
  expireMinutes: number;
}
