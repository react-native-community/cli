import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {HealthCheckInterface} from '@react-native-community/cli-types';

export default {
  label: 'Node.js',
  getDiagnostics: async ({Binaries}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Node.version,
      versionRange: versionRanges.NODE_JS,
    }),
    version: Binaries.Node.version,
    versionRange: versionRanges.NODE_JS,
  }),
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.fail();

    logManualInstallation({
      healthcheck: 'Node.js',
      url: 'https://nodejs.org/en/download/',
    });
  },
} as HealthCheckInterface;
