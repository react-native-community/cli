import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {install} from '../../../tools/install';
import {HealthCheckInterface} from '../types';

const label = 'Watchman';

export default {
  label,
  getDiagnostics: async ({Binaries}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Watchman.version,
      versionRange: versionRanges.WATCHMAN,
    }),
  }),
  runAutomaticFix: async ({loader}) =>
    await install({
      pkg: 'watchman',
      label,
      source: 'https://facebook.github.io/watchman/docs/install.html',
      loader,
    }),
} as HealthCheckInterface;
