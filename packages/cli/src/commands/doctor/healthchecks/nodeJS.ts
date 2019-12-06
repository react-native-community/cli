import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logManualInstallation} from './common';
import {HealthCheckInterface} from '../types';

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
  runAutomaticFix: async ({loader}) => {
    loader.fail();

    logManualInstallation({
      healthcheck: 'Node.js',
      url: 'https://nodejs.org/en/download/',
    });
  },
} as HealthCheckInterface;
