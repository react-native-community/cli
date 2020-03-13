import execa from 'execa';

/**
 * Executes the given `command` on a shell taking care of slicing the parameters
 * if needed.
 */
const executeShellCommand = async (command: string) => {
  const args = command.split(' ');
  const program = args.shift()!;

  await execa(program, args, {shell: true});
};

export {executeShellCommand as executeCommand};
