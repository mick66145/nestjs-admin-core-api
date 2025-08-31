import { registerAs } from '@nestjs/config';
import { APP_NAME, APP_VERSION } from 'src/app.constant';
import { AppConfigInterface } from './app-config.interface';

export default registerAs(
  'app',
  (): AppConfigInterface => ({
    nodeEnv: process.env.NODE_ENV,
    name: process.env.APP_NAME || APP_NAME,
    version: APP_VERSION,
    globalPrefix: process.env.APP_URL_GLOBAL_PREFIX ?? '',
    workDir: process.env.PWD || process.cwd(),
    port: parseInt(process.env.APP_PORT ?? '3000', 10) || 3000,
  }),
);
