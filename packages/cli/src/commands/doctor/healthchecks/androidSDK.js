import chalk from 'chalk';
import {logManualInstallation} from './common';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';

const installMessage = `Read more about how to update Android SDK at ${chalk.dim(
  'https://developer.android.com/studio',
)}`;

export default {
  label: 'Android SDK',
  getDiagnosticsAsync: async ({SDKs}) => ({
    needsToBeFixed:
      (SDKs['Android SDK'] === 'Not Found' && installMessage) ||
      doesSoftwareNeedToBeFixed({
        version: SDKs['Android SDK']['Build Tools'][0],
        versionRange: versionRanges.ANDROID_NDK,
      }),
  }),
  runAutomaticFix: async ({loader, environmentInfo}) => {
    const version = environmentInfo.SDKs['Android SDK'][0];
    const isNDKInstalled = version !== 'Not Found';

    loader.fail();

    if (isNDKInstalled) {
      return logManualInstallation({
        message: installMessage,
      });
    }

    return logManualInstallation({
      healthcheck: 'Android SDK',
      url: 'https://developer.android.com/studio',
    });
  },
};
