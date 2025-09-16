// import crashlytics from '@react-native-firebase/crashlytics';
import {
  getCrashlytics,
  recordError,
} from '@react-native-firebase/crashlytics';
import { Logger } from '@utils/log';

const crashlytics = getCrashlytics();

export function handleError(defaultMessage?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Array<any>) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : defaultMessage || 'An unexpected error occurred';

        recordError(
          crashlytics,
          error instanceof Error ? error : new Error(errorMessage),
          propertyKey
        );

        Logger.error(`Error in ${target}.${propertyKey}:`, errorMessage);

        throw new Error(errorMessage);
      }
    };

    return descriptor;
  };
}
