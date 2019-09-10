import execa from 'execa';

const makeHook = (command: string): (() => execa.ExecaChildProcess) => {
  return () => {
    const args: Array<string> = command.split(' ');
    const cmd: string | any = args.shift();

    return execa(cmd, args, {stdio: 'inherit'});
  };
};
export default makeHook;
