export const MessageSendMethod = {
  EMAIL: 'email',
  SMS: 'sms',
} as const;

export type MessageSendMethod =
  (typeof MessageSendMethod)[keyof typeof MessageSendMethod];
