import execa from 'execa';

export default function makeHook(command: string) {
  return () => {
    const args: Array<string> = command.split(' ');
    const cmd: string | any = args.shift();

    return execa(cmd, args, {stdio: 'inherit'});
  };
}
