import {logger} from '@react-native-community/cli-tools';
import execa from 'execa';

export function executeCommand(
  command: string,
  args: Array<string>,
  options: {
    root: string;
    silent?: boolean;
  },
) {
  return execa(command, args, {
    stdio: options.silent && !logger.isVerbose() ? 'pipe' : 'inherit',
    cwd: options.root,
  });
}
