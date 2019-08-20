import chalk from 'chalk';
import {logManualInstallation} from './common';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';

const iosDeploy = {
  label: 'Android NDK',
  getDiagnosticsAsync: async ({SDKs}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: SDKs['Android SDK']['Android NDK'],
      versionRange: versionRanges.ANDROID_NDK,
    }),
  }),
  runAutomaticFix: async ({loader, environmentInfo}) => {
    const version = environmentInfo.SDKs['Android SDK']['Android NDK'];
    const isNDKInstalled = version !== 'Not Found';

    loader.fail();

    if (isNDKInstalled) {
      return logManualInstallation({
        message: `Read more about how to update Android NDK at ${chalk.dim(
          'https://developer.android.com/ndk/downloads',
        )}`,
      });
    }

    return logManualInstallation({
      healthcheck: 'Android NDK',
      url: 'https://developer.android.com/ndk/downloads',
    });
  },
};

export default iosDeploy;
