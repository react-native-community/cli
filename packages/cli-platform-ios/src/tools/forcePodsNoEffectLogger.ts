import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';

export default function forcePodsNoEffectLogger() {
  logger.warn(
    `${chalk.bold(
      '--force-pods',
    )} has no effect because automatic CocoaPods installation is disabled. In order to use this flag, set ${chalk.bold(
      'project.ios.automaticPodsInstallation',
    )} to true in ${chalk.bold(
      'react-native.config.js',
    )}. For more information, see ${chalk.underline(
      'https://github.com/react-native-community/cli/blob/main/docs/projects.md#projectiosautomaticpodsinstallation',
    )}`,
  );
}
