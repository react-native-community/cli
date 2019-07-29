import execa from 'execa';
import {isSoftwareInstalled} from '../checkInstallation';

const delay = amount => new Promise(resolve => setTimeout(resolve, amount));

const cocoaPods = {
  label: 'CocoaPods',
  getDiagnosticsAsync: async () => ({
    needsToBeFixed: !(await isSoftwareInstalled('pod')),
  }),
  runAutomaticFix: async ({loader}) => {
    try {
      // First attempt to install `cocoapods`
      await execa('gem', ['install', 'cocoapods']);
    } catch (_error) {
      // TODO: find a way to not need this as it breaks the flow of the UI
      // maybe by looking into the `process.stdout`
      // `loader` needs to stop in order to show the "password request" if running with sudo
      loader.stop();

      throw new Error();

      // If that doesn't work then try with sudo
      // await execa('sudo', ['gem', 'install', 'cocoapods']);
    }
  },
};

export default cocoaPods;
