import {isSoftwareInstalled} from '../checkInstallation';
import {installCocoaPods} from '../../../tools/installPods';

export default {
  label: 'CocoaPods',
  getDiagnosticsAsync: async () => ({
    needsToBeFixed: !(await isSoftwareInstalled('pod')),
  }),
  runAutomaticFix: async ({loader}) => await installCocoaPods(loader),
};
