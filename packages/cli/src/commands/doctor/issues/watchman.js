import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';

const watchman = {
  label: 'Watchman',
  getDiagnostics: ({Binaries}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Watchman.version,
      versionRange: versionRanges.WATCHMAN,
    }),
  }),
  runAutomaticFix: () => console.log('should fix watchman'),
};

export default watchman;
