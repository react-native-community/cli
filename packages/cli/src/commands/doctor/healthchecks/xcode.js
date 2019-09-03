import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logManualInstallation} from './common';

export default {
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
      healthcheck: 'Xcode',
      url: 'https://developer.apple.com/xcode/',
    });
  },
};
