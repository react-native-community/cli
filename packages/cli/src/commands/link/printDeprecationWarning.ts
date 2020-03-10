import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';

export default function printDeprecationWarning(command: string) {
  logger.warn(
    `Calling ${chalk.bold(
      command,
    )} is deprecated in favor of autolinking. It will be removed in the next major release.\nAutolinking documentation: ${chalk.dim.underline(
      'https://github.com/react-native-community/cli/blob/master/docs/autolinking.md',
    )}`,
  );
}
