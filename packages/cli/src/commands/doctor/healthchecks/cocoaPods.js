import execa from 'execa';
import {isSoftwareInstalled} from '../checkInstallation';

const hasSudoGranted = async () => {
  try {
    await execa('sudo', ['-nv']);

    return true;
  } catch (_ignored) {
    return false;
  }
};

// This is to show the loader but clear the `Password` prompt from the screen
const reportLoader = async ({loader, type, userHasSudoGranted}) => {
  process.stdout.moveCursor(0, userHasSudoGranted ? -1 : -2);
  process.stdout.clearScreenDown();

  loader[type]();
};

export default {
  label: 'CocoaPods',
  getDiagnosticsAsync: async () => ({
    needsToBeFixed: !(await isSoftwareInstalled('pod')),
  }),
  runAutomaticFix: async ({loader}) => {
    try {
      // First attempt to install `cocoapods`
      await execa('gem', ['install', 'cocoapods']);

      loader.succeed();
    } catch (_error) {
      // This stops the loader so the user can provide a password to the `sudo` command
      loader.stopAndPersist();

      const userHasSudoGranted = await hasSudoGranted();

      try {
        await execa('sudo', ['gem', 'install', 'cocoapods']);

        return await reportLoader({
          loader,
          type: 'succeed',
          userHasSudoGranted,
        });
      } catch (_ignored) {
        return await reportLoader({loader, type: 'fail', userHasSudoGranted});
      }
    }
  },
};
