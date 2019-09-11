// @flow
import execa from 'execa';
import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';
import {checkSoftwareInstalled} from '../checkInstallation';
// $FlowFixMe - converted to TS
import {
  promptCocoaPodsInstallationQuestion,
  runSudo,
} from '../../../tools/installPods';
import {brewInstall} from '../../../tools/brewInstall';
import {type HealthCheckInterface} from '../types';

function clearQuestion() {
  // Remove the fix options from screen
  // $FlowFixMe
  process.stdout.moveCursor(0, -2);
  // $FlowFixMe
  process.stdout.clearScreenDown();
}

export default ({
  label: 'CocoaPods',
  getDiagnostics: async () => ({
    needsToBeFixed: await checkSoftwareInstalled('pod'),
  }),
  runAutomaticFix: async ({loader}) => {
    loader.stop();

    const {
      installWithGem,
      installWithHomebrew,
    } = await promptCocoaPodsInstallationQuestion();

    const installationMethod = installWithGem ? 'gem' : 'Homebrew';
    const loaderInstallationMessage = `CocoaPods (installing with ${installationMethod})`;
    const loaderSucceedMessage = `CocoaPods (installed with ${installationMethod})`;

    // Remove the prompt after the question of how to install CocoaPods is answered
    clearQuestion();

    if (installWithGem) {
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
          loader.fail();
          logger.log(chalk.dim(`\n${error}`));

          return logger.log(
            `An error occured while trying to install CocoaPods. Please try again manually: ${chalk.bold(
              'sudo gem install cocoapods',
            )}`,
          );
        }
      }
    }

    if (installWithHomebrew) {
      return await brewInstall({
        pkg: 'cocoapods',
        label: loaderInstallationMessage,
        succeedMessage: loaderSucceedMessage,
        loader,
      });
    }
  },
}: HealthCheckInterface);
