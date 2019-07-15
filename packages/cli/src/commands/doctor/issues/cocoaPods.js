import {isSoftwareInstalled} from '../checkInstallation';

const delay = amount => new Promise(resolve => setTimeout(resolve, amount));

const cocoaPods = {
  label: 'CocoaPods',
  getDiagnosticsAsync: async () => ({
    needsToBeFixed: !(await isSoftwareInstalled('pod')),
  }),
  runAutomaticFix: () => delay(5000),
};

export default cocoaPods;
