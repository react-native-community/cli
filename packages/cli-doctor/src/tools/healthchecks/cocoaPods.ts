import {execa} from 'execa';
import {runSudo} from '@react-native-community/cli-tools';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logError} from './common';
import {HealthCheckInterface} from '../../types';
import versionRanges from '../versionRanges';

const label = 'CocoaPods';

export default {
  label,
  description: 'Required for installing iOS dependencies',
  getDiagnostics: async ({Managers}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Managers.CocoaPods.version,
      versionRange: versionRanges.COCOAPODS,
    }),
    version: Managers.CocoaPods.version,
    versionRange: versionRanges.COCOAPODS,
  }),
  runAutomaticFix: async ({loader}) => {
    loader.stop();

    const installMethodCapitalized = 'Gem';
    const loaderInstallationMessage = `${label} (installing with ${installMethodCapitalized})`;
    const loaderSucceedMessage = `${label} (installed with ${installMethodCapitalized})`;

    loader.start(loaderInstallationMessage);

    const options = ['install', 'cocoapods', '--no-document'];

    try {
      // First attempt to install `cocoapods`
      await execa('gem', options);

      return loader.succeed(loaderSucceedMessage);
    } catch (_error) {
      // If that doesn't work then try with sudo
      try {
        await runSudo(`gem ${options.join(' ')}`);

        return loader.succeed(loaderSucceedMessage);
      } catch (error) {
        logError({
          healthcheck: label,
          loader,
          error: error as any,
          command: 'sudo gem install cocoapods',
        });
      }
    }
    return;
  },
} as HealthCheckInterface;
