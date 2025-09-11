export const ThirdPartyLoginType = {
  GOOGLE: 'google',
  LINE: 'line',
} as const;

export type ThirdPartyLoginType =
  (typeof ThirdPartyLoginType)[keyof typeof ThirdPartyLoginType];
