import chalk from 'chalk';
import {Ora} from 'ora';
import {logManualInstallation} from './common';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {EnvironmentInfo, HealthCheckInterface} from '../types';

export default {
  label: 'Android NDK',
  description: 'required for building React Native from the source',
  getDiagnostics: async ({SDKs}: EnvironmentInfo) => {
    const androidSdk = SDKs['Android SDK'];
    return {
      needsToBeFixed: doesSoftwareNeedToBeFixed({
        version:
          androidSdk === 'Not Found' ? 'Not Found' : androidSdk['Android NDK'],
        versionRange: versionRanges.ANDROID_NDK,
      }),
    };
  },
  runAutomaticFix: async ({
    loader,
    environmentInfo,
  }: {
    loader: Ora;
    environmentInfo: EnvironmentInfo;
  }) => {
    const androidSdk = environmentInfo.SDKs['Android SDK'];
    const isNDKInstalled =
      androidSdk !== 'Not Found' && androidSdk['Android NDK'] !== 'Not Found';

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
} as HealthCheckInterface;
