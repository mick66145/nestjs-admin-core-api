export const ForgetPasswordSendMethod = {
  EMAIL: 'email',
  SMS: 'sms',
} as const;

export type ForgetPasswordSendMethod =
  (typeof ForgetPasswordSendMethod)[keyof typeof ForgetPasswordSendMethod];
