import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';

export default function printDeprecationWarning(command: string) {
  logger.warn(
    `Calling ${chalk.bold(
      command,
    )} is deprecated in favor of autolinking feature and it will be removed in the next major release. You can find more information about it in the documentation: ${chalk.bold(
      'https://github.com/react-native-community/cli/blob/master/docs/autolinking.md',
    )}`,
  );
}
