import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';

const xcode = {
  label: 'Xcode',
  getDiagnostics: ({IDEs}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: IDEs.Xcode.version.split('/')[0],
      versionRange: versionRanges.XCODE,
    }),
  }),
  runAutomaticFix: () => console.log('should fix Xcode'),
};

export default xcode;
