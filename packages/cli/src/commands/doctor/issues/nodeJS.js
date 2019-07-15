import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';

const delay = amount => new Promise(resolve => setTimeout(resolve, amount));

const issue = {
  label: 'Node.js',
  getDiagnostics: ({Binaries}) => ({
    version: Binaries.Node.version,
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Node.version,
      versionRange: versionRanges.NODE_JS,
    }),
  }),
  runAutomaticFix: () => delay(3000),
};

export default issue;
