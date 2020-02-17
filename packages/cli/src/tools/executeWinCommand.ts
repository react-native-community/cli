import execa from 'execa';

const executeCommand = async (command: string) => {
  const args = command.split(' ');
  const program = args.shift()!;

  await execa(program, args, {shell: true});
};

export {executeCommand};
