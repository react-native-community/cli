import pico from 'picocolors';
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
  logger.log(pico.bold('Usage'));
  printOption(
    `${pico.dim('Press')} ${KEYS.FIX_ALL_ISSUES} ${pico.dim(
      'to try to fix issues.',
    )}`,
  );
  printOption(
    `${pico.dim('Press')} ${KEYS.FIX_ERRORS} ${pico.dim(
      'to try to fix errors.',
    )}`,
  );
  printOption(
    `${pico.dim('Press')} ${KEYS.FIX_WARNINGS} ${pico.dim(
      'to try to fix warnings.',
    )}`,
  );
  printOption(`${pico.dim('Press')} Enter ${pico.dim('to exit.')}`);
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
