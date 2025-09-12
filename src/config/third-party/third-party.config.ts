import { registerAs } from '@nestjs/config';
import { ThirdPartyConfigInterface } from './third-party-config.interface';

export const token = 'thirdParty';
export const configFactory = (): ThirdPartyConfigInterface => ({
  e8d: {
    UID: process.env.E8D_SMS_UID ?? '',
    PWD: process.env.E8D_SMS_PWD ?? '',
    apiSite: process.env.E8D_SMS_API_SITE ?? 'https://api.e8d.tw/',
  },
  googleMail: {
    smtp: {
      host: process.env.GOOGLE_MAIL_SMTP_HOST ?? 'smtp.gmail.com',
      port: parseInt(process.env.GOOGLE_MAIL_SMTP_PORT ?? '', 10) || 587,
    },
    email: process.env.GOOGLE_MAIL_APP_EMAIL ?? '',
    password: process.env.GOOGLE_MAIL_APP_PASSWORD ?? '',
  },
  googleLogin: {
    webClientId: process.env.GOOGLE_LOGIN_WEB_CLIENT_ID ?? '',
    iosClientId: process.env.GOOGLE_LOGIN_IOS_CLIENT_ID ?? '',
    androidClientId: process.env.GOOGLE_LOGIN_ANDROID_CLIENT_ID ?? '',
  },
  lineLogin: {
    channelId: process.env.LINE_LOGIN_CHANNEL_ID ?? '',
  },
});

export default registerAs(token, configFactory);
