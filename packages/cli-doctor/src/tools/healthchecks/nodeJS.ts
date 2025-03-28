import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {HealthCheckInterface} from '../../types';

export default {
  label: 'Node.js',
  description: 'Required to execute JavaScript code',
  getDiagnostics: async ({Binaries}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Node.version,
      versionRange: versionRanges.NODE_JS,
    }),
    version: Binaries.Node.version,
    versionRange: versionRanges.NODE_JS,
  }),
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.error();

    logManualInstallation({
      healthcheck: 'Node.js',
      url: 'https://nodejs.org/en/download/',
    });
  },
} as HealthCheckInterface;
