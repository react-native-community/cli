import execa from 'execa';
import {isSoftwareNotInstalled} from '../checkInstallation';
import {
  promptCocoaPodsInstallationQuestion,
  runSudo,
} from '../../../tools/installPods';
import {removeMessage, logError} from './common';
import {brewInstall} from '../../../tools/brewInstall';
import {HealthCheckInterface} from '../types';

const label = 'CocoaPods';

export default {
  label,
  description: 'Required for installing iOS dependencies',
  getDiagnostics: async () => ({
    needsToBeFixed: await isSoftwareNotInstalled('pod'),
  }),
  runAutomaticFix: async ({loader}) => {
    loader.stop();

    const {
      installMethod,
      promptQuestion,
    } = await promptCocoaPodsInstallationQuestion();

    // Capitalise `Homebrew` when printing on the screen
    const installMethodCapitalized =
      installMethod === 'homebrew'
        ? installMethod.substr(0, 1).toUpperCase() + installMethod.substr(1)
        : installMethod;
    const loaderInstallationMessage = `${label} (installing with ${installMethodCapitalized})`;
    const loaderSucceedMessage = `${label} (installed with ${installMethodCapitalized})`;

    // Remove the prompt after the question of how to install CocoaPods is answered
    removeMessage(promptQuestion);

    if (installMethod === 'gem') {
      loader.start(loaderInstallationMessage);

      const options = ['install', 'cocoapods', '--no-document'];

      try {
        // First attempt to install `cocoapods`
        await execa('gem', options);

        return loader.succeed(loaderSucceedMessage);
      } catch (_error) {
        // If that doesn't work then try with sudo
        try {
          await runSudo(`gem ${options.join(' ')}`);

          return loader.succeed(loaderSucceedMessage);
        } catch (error) {
          logError({
            healthcheck: label,
            loader,
            error,
            command: 'sudo gem install cocoapods',
          });
        }
      }
    }

    if (installMethod === 'homebrew') {
      return await brewInstall({
        pkg: 'cocoapods',
        label: loaderInstallationMessage,
        loader,
        onSuccess: () => loader.succeed(loaderSucceedMessage),
      });
    }
  },
} as HealthCheckInterface;
