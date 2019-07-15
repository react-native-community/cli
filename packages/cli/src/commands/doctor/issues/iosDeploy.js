import {isSoftwareInstalled} from '../checkInstallation';

const delay = amount => new Promise(resolve => setTimeout(resolve, amount));

const iosDeploy = {
  label: 'ios-deploy',
  isRequired: false,
  getDiagnosticsAsync: async () => ({
    needsToBeFixed: !(await isSoftwareInstalled('ios-deploy')),
  }),
  runAutomaticFix: () => delay(5000),
};

export default iosDeploy;
