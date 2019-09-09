// @flow
import execa from 'execa';
import Ora from 'ora';
import {isSoftwareInstalled, PACKAGE_MANAGERS} from '../checkInstallation';
import {packageManager} from './packageManagers';
import {logManualInstallation} from './common';
import type {HealthCheckInterface} from '../types';

const getInstallationCommand = () => {
  if (packageManager === PACKAGE_MANAGERS.YARN) {
    return 'yarn global add ios-deploy';
  }

  if (packageManager === PACKAGE_MANAGERS.NPM) {
    return 'npm install ios-deploy --global';
  }

  return undefined;
};

export default ({
  label: 'ios-deploy',
  isRequired: false,
  getDiagnostics: async () => ({
    needsToBeFixed: !(await isSoftwareInstalled('ios-deploy')),
  }),
  runAutomaticFix: async ({loader}: {loader: typeof Ora}) => {
    const installationCommand = getInstallationCommand();

    // This means that we couldn't "guess" the package manager
    if (installationCommand === undefined) {
      loader.fail();

      // Then we just print out the URL that the user can head to download the library
      logManualInstallation({
        healthcheck: 'ios-deploy',
        url: 'https://github.com/ios-control/ios-deploy#readme',
      });
      return;
    }

    try {
      const installationCommandArgs = installationCommand.split(' ');

      await execa(
        installationCommandArgs[0],
        installationCommandArgs.splice(1),
      );

      loader.succeed();
    } catch (_error) {
      logManualInstallation({
        healthcheck: 'ios-deploy',
        command: installationCommand,
      });
    }
  },
}: HealthCheckInterface);
