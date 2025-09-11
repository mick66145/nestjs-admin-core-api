import appConfig from 'src/_libs/app/app.config';
import apiKeyConfig from 'src/_libs/auth/api-key.config';
import loggerConfig from 'src/_libs/logger/logger.config';
import swaggerConfig from 'src/_libs/app/swagger.config';
import appProjectConfig from './app-project/app-project.config';
import jwtConfig from 'src/_libs/auth/jwt.config';
import verificationConfig from './verification/verification.config';

export const configLoads = [
  appConfig,
  apiKeyConfig,
  loggerConfig,
  swaggerConfig,
  appProjectConfig,
  jwtConfig,
  verificationConfig,
];
