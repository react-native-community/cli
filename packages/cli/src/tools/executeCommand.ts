import {logger} from '@react-native-community/cli-tools';
import {spawn} from 'child_process';

export function executeCommand(
  command: string,
  args: Array<string>,
  options: {
    root: string;
    silent?: boolean;
  },
) {
  const stdio = options.silent && !logger.isVerbose() ? 'ignore' : 'inherit';
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {stdio, cwd: options.root});
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command failed: ${command} ${args.join(' ')} (exit code ${code})`,
          ),
        );
      }
    });
    child.on('error', reject);
  });
}
