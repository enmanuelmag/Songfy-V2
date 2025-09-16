import * as Application from 'expo-application';

import { Logger } from './log';

type ResultAppStore = {
  results?: Array<{
    version: string;
  }>;
};

export const checkUpdateAvailable = async () => {
  const storeInfoURL =
    'http://itunes.apple.com/lookup?bundleId=budgetfy.cardor';

  try {
    const response = await fetch(storeInfoURL, {
      cache: 'no-cache',
      method: 'GET',
    });
    const data = (await response.json()) as ResultAppStore;

    if (!data.results || data.results.length === 0) {
      return false;
    }

    const [{ version: appStoreVerion }] = data.results;

    const currentVersion = Application.nativeApplicationVersion;

    if (!currentVersion) {
      return false;
    }

    return isGreaterVersion(currentVersion, appStoreVerion);
  } catch (error) {
    Logger.error('Error checking for updates:', error);
    return false;
  }
};

function isGreaterVersion(currentVersion: string, appStoreVerion: string) {
  const currentVersionArr = currentVersion.split('.');
  const appStoreVerionArr = appStoreVerion.split('.');

  for (let i = 0; i < currentVersionArr.length; i++) {
    const current = Number(currentVersionArr[i]);
    const appStore = Number(appStoreVerionArr[i]);

    if (current > appStore) {
      return false;
    }

    if (current < appStore) {
      return true;
    }
  }

  return false;
}
