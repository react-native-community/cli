/**
 * @flow
 */

import {spawn} from 'child_process';

export default function makeCommand(command: string) {
  return (cb: Function) => {
    if (!cb) {
      throw new Error(
        `You missed a callback function for the ${command} command`,
      );
    }

    const args = command.split(' ');
    const cmd = args.shift();

    const commandProcess = spawn(cmd, args, {
      stdio: 'inherit',
      stdin: 'inherit',
    });

    commandProcess.on('close', code => {
      if (code) {
        throw new Error(`Error occurred during executing "${command}" command`);
      }

      cb();
    });
  };
}
