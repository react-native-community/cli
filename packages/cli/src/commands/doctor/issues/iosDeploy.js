import execa from 'execa';
import {isSoftwareInstalled, PACKAGE_MANAGERS} from '../checkInstallation';
import {packageManager} from './packageManagers';

const iosDeploy = {
  label: 'ios-deploy',
  isRequired: false,
  getDiagnosticsAsync: async () => ({
    needsToBeFixed: !(await isSoftwareInstalled('ios-deploy')),
  }),
  runAutomaticFix: async () => {
    if (packageManager === PACKAGE_MANAGERS.YARN) {
      return await execa('yarn', ['global', 'add', 'ios-deploy']);
    }

    if (packageManager === PACKAGE_MANAGERS.NPM) {
      return await execa('npm', ['install', 'ios-deploy', '--global']);
    }

    // Show instructions on how to install manually
  },
};

export default iosDeploy;
