import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {install} from '../../../tools/install';

export default {
  label: 'Watchman',
  getDiagnostics: ({Binaries}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Watchman.version,
      versionRange: versionRanges.WATCHMAN,
    }),
  }),
  runAutomaticFix: async ({loader}) =>
    await install(
      'watchman',
      'https://facebook.github.io/watchman/docs/install.html',
      loader,
    ),
};
