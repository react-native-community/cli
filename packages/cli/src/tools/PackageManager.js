// @flow
import {execSync} from 'child_process';
import {getYarnVersionIfAvailable, isProjectUsingYarn} from './yarn';

type Options = {|
  preferYarn?: boolean,
  silent?: boolean,
|};

let projectDir;

function executeCommand(command: string, options?: Options) {
  return execSync(command, {
    stdio: options && options.silent ? 'pipe' : 'inherit',
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
    ? executeCommand(`yarn add ${packageNames.join(' ')}`, options)
    : executeCommand(
        `npm install ${packageNames.join(' ')} --save --save-exact`,
        options,
      );
}

export function installDev(packageNames: Array<string>, options?: Options) {
  return shouldUseYarn(options)
    ? executeCommand(`yarn add -D ${packageNames.join(' ')}`, options)
    : executeCommand(
        `npm install ${packageNames.join(' ')} --save-dev --save-exact`,
        options,
      );
}

export function uninstall(packageNames: Array<string>, options?: Options) {
  return shouldUseYarn(options)
    ? executeCommand(`yarn remove ${packageNames.join(' ')}`, options)
    : executeCommand(`npm uninstall ${packageNames.join(' ')} --save`, options);
}
