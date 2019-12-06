import execa from 'execa';

export default function makeHook(command: string) {
  return () => {
    const args = command.split(' ');
    const cmd = args.shift() as string;

    return execa(cmd, args, {stdio: 'inherit'});
  };
}
