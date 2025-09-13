export const VerifyType = {
  REGISTER: 'register',
  FORGET_PASSWORD: 'forgetPassword',
  FORGET_PASSWORD_RESET: 'forgetPasswordReset',
} as const;

export type VerifyType = (typeof VerifyType)[keyof typeof VerifyType];
