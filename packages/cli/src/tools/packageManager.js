// @flow
import execa from 'execa';
import logger from './logger';
import {getYarnVersionIfAvailable, isProjectUsingYarn} from './yarn';

type Options = {|
  preferYarn?: boolean,
  silent?: boolean,
|};

let projectDir;

function executeCommand(
  command: string,
  args: Array<string>,
  options?: Options,
) {
  return execa(command, args, {
    stdio:
      options && options.silent && !logger.isVerbose() ? 'pipe' : 'inherit',
  });
}

function shouldUseYarn(options?: Options) {
  if (options && options.preferYarn !== undefined) {
    return options.preferYarn && getYarnVersionIfAvailable();
  }

  return isProjectUsingYarn(projectDir) && getYarnVersionIfAvailable();
}

export function setProjectDir(dir: string) {
  projectDir = dir;
}

export function install(packageNames: Array<string>, options?: Options) {
  return shouldUseYarn(options)
    ? executeCommand('yarn', ['add', ...packageNames], options)
    : executeCommand(
        'npm',
        ['install', ...packageNames, '--save', '--save-exact'],
        options,
      );
}

export function installDev(packageNames: Array<string>, options?: Options) {
  return shouldUseYarn(options)
    ? executeCommand('yarn', ['add', '-D', ...packageNames], options)
    : executeCommand(
        'npm',
        ['install', ...packageNames, '--save-dev', '--save-exact'],
        options,
      );
}

export function uninstall(packageNames: Array<string>, options?: Options) {
  return shouldUseYarn(options)
    ? executeCommand('yarn', ['remove', ...packageNames], options)
    : executeCommand('npm', ['uninstall', ...packageNames, '--save'], options);
}

export function installAll(options?: Options) {
  return shouldUseYarn(options)
    ? executeCommand('yarn', ['install'], options)
    : executeCommand('npm', ['install'], options);
}
