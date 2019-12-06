import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';

const KEYS = {
  FIX_ALL_ISSUES: 'f',
  FIX_ERRORS: 'e',
  FIX_WARNINGS: 'w',
  EXIT: '\r',
};

const printOption = (option: string) => logger.log(` \u203A ${option}`);
const printOptions = () => {
  logger.log();
  logger.log(chalk.bold('Usage'));
  printOption(
    `${chalk.dim('Press')} ${KEYS.FIX_ALL_ISSUES} ${chalk.dim(
      'to try to fix issues.',
    )}`,
  );
  printOption(
    `${chalk.dim('Press')} ${KEYS.FIX_ERRORS} ${chalk.dim(
      'to try to fix errors.',
    )}`,
  );
  printOption(
    `${chalk.dim('Press')} ${KEYS.FIX_WARNINGS} ${chalk.dim(
      'to try to fix warnings.',
    )}`,
  );
  printOption(`${chalk.dim('Press')} Enter ${chalk.dim('to exit.')}`);
};

export {KEYS};
export default ({onKeyPress}: {onKeyPress: (...args: any[]) => void}) => {
  printOptions();

  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', onKeyPress);
};
