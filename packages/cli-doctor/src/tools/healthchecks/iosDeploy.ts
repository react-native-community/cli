import execa from 'execa';
import chalk from 'chalk';
import prompts from 'prompts';
import {isSoftwareNotInstalled, PACKAGE_MANAGERS} from '../checkInstallation';
import {packageManager} from './packageManagers';
import {logError, removeMessage} from './common';
import {HealthCheckInterface, Loader} from '../../types';

const label = 'ios-deploy';

const installationWithYarn = 'yarn global add ios-deploy';
const installationWithNpm = 'npm install ios-deploy --global';

const identifyInstallationCommand = () => {
  if (packageManager === PACKAGE_MANAGERS.YARN) {
    return installationWithYarn;
  }

  if (packageManager === PACKAGE_MANAGERS.NPM) {
    return installationWithNpm;
  }

  return undefined;
};

const installLibrary = async ({
  installationCommand,
  packageManagerToUse,
  loader,
}: {
  installationCommand: string;
  packageManagerToUse: 'yarn' | 'npm';
  loader: Loader;
}) => {
  try {
    loader.start(`${label} (installing with ${packageManagerToUse})`);

    const installationCommandArgs = installationCommand.split(' ');

    await execa(installationCommandArgs[0], installationCommandArgs.splice(1));

    loader.succeed(`${label} (installed with ${packageManagerToUse})`);
  } catch (error) {
    logError({
      healthcheck: label,
      loader,
      error: error as Error,
      command: installationCommand,
    });
  }
};

export default {
  label,
  isRequired: false,
  description:
    'Required for installing your app on a physical device with the CLI',
  getDiagnostics: async () => ({
    needsToBeFixed: await isSoftwareNotInstalled('ios-deploy'),
  }),
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.stop();

    const installationCommand = identifyInstallationCommand();

    // This means that we couldn't "guess" the package manager
    if (installationCommand === undefined) {
      const promptQuestion = `ios-deploy needs to be installed either by ${chalk.bold(
        'yarn',
      )} ${chalk.reset('or')} ${chalk.bold(
        'npm',
      )} ${chalk.reset()}, which one do you want to use?`;
      const installWithYarn = {title: 'yarn', value: 'yarn'};
      const installWithNpm = {title: 'npm', value: 'npm'};
      const skipInstallation = {
        title: 'Skip installation',
        value: 'skip',
      };

      const {chosenPackageManager} = await prompts([
        {
          type: 'select',
          name: 'chosenPackageManager',
          message: promptQuestion,
          choices: [installWithYarn, installWithNpm, skipInstallation],
        },
      ]);

      removeMessage(`? ${promptQuestion} ${chosenPackageManager}`);

      if (
        chosenPackageManager === skipInstallation.value ||
        !chosenPackageManager // e.g. when user presses Esc
      ) {
        loader.fail();

        // Then we just print out the URL that the user can head to download the library
        logManualInstallation({
          healthcheck: 'ios-deploy',
          url: 'https://github.com/ios-control/ios-deploy#readme',
        });

        return;
      }

      const shouldInstallWithYarn =
        chosenPackageManager === installWithYarn.value;

      return installLibrary({
        installationCommand: shouldInstallWithYarn
          ? installationWithYarn
          : installationWithNpm,
        loader,
        packageManagerToUse: chosenPackageManager,
      });
    }

    return installLibrary({
      installationCommand,
      packageManagerToUse: packageManager!.toLowerCase() as 'yarn' | 'npm',
      loader,
    });
  },
} as HealthCheckInterface;
