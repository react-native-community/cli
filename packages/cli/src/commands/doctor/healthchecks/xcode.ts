import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {HealthCheckInterface} from '@react-native-community/cli-types';

export default {
  label: 'Xcode',
  description: 'Required for building and installing your app on iOS',
  getDiagnostics: async ({IDEs}) => {
    const version = IDEs.Xcode.version.split('/')[0];

    return {
      needsToBeFixed: doesSoftwareNeedToBeFixed({
        version,
        versionRange: versionRanges.XCODE,
      }),
      version,
      versionRange: versionRanges.XCODE,
    };
  },
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.fail();

    logManualInstallation({
      healthcheck: 'Xcode',
      url: 'https://developer.apple.com/xcode/',
    });
  },
} as HealthCheckInterface;
