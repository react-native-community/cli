import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logManualInstallation} from './common';

const xcode = {
  label: 'Xcode',
  getDiagnostics: ({IDEs}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: IDEs.Xcode.version.split('/')[0],
      versionRange: versionRanges.XCODE,
    }),
  }),
  runAutomaticFix: ({loader}) => {
    loader.info();

    logManualInstallation({
      issue: 'Xcode',
      url: 'https://developer.apple.com/xcode/',
    });
  },
};

export default xcode;
