import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logManualInstallation} from './common';
import {HealthCheckInterface} from '../types';

export default {
  label: 'Xcode',
  description: 'required for building and installing your app on iOS',
  getDiagnostics: async ({IDEs}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: IDEs.Xcode.version.split('/')[0],
      versionRange: versionRanges.XCODE,
    }),
  }),
  runAutomaticFix: async ({loader}) => {
    loader.info();

    logManualInstallation({
      healthcheck: 'Xcode',
      url: 'https://developer.apple.com/xcode/',
    });
  },
} as HealthCheckInterface;
