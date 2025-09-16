import { EnvSchema } from '@customTypes/env';
import { Logger } from '@utils/log';


const { success, error, data } = EnvSchema.safeParse(process.env);

if (!success) {
  Logger.error('Invalid env', error.format());
  throw new Error('Invalid env');
} else {
  Logger.info('Env loaded');
}

const EnvConfig = data;

export default EnvConfig;
