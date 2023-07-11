import {isSoftwareNotInstalled} from '../checkInstallation';
import {HealthCheckInterface} from '../../types';
import {brewInstall} from '../brewInstall';
import chalk from 'chalk';

const packageName = 'ios-deploy';

export default {
  label: packageName,
  isRequired: false,
  description:
    'Required for installing your app on a physical device with the CLI',
  getDiagnostics: async () => ({
    needsToBeFixed: await isSoftwareNotInstalled(packageName),
  }),
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    await brewInstall({
      pkg: packageName,
      label: packageName,
      loader,
      onSuccess: () => {
        loader.succeed(
          `Successfully installed ${chalk.bold(packageName)} with Homebrew`,
        );
      },
      onFail: () => {
        loader.fail();
        logManualInstallation({
          healthcheck: packageName,
          url: 'https://github.com/ios-control/ios-deploy#installation',
        });
      },
    });
  },
} as HealthCheckInterface;
