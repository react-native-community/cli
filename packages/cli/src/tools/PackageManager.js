// @flow
import {execSync} from 'child_process';
import {getYarnVersionIfAvailable} from './yarn';

type Options = {
  preferYarn: boolean,
  silent?: boolean,
};

function executeCommand(command: string, silent?: boolean = false) {
  return execSync(command, {
    stdio: silent ? 'pipe' : 'inherit',
  });
}

export function shouldUseYarn(preferYarn: boolean) {
  return preferYarn && getYarnVersionIfAvailable();
}

export function install(packageNames: Array<string>, options: Options) {
  return shouldUseYarn(options.preferYarn)
    ? executeCommand(`yarn add ${packageNames.join(' ')}`, options.silent)
    : executeCommand(
        `npm install ${packageNames.join(' ')} --save --save-exact`,
        options.silent,
      );
}

export function installDev(packageNames: Array<string>, options: Options) {
  return shouldUseYarn(options.preferYarn)
    ? executeCommand(`yarn add -D ${packageNames.join(' ')}`)
    : executeCommand(
        `npm install ${packageNames.join(' ')} --save-dev --save-exact`,
      );
}

export function uninstall(packageNames: Array<string>, options: Options) {
  return shouldUseYarn(options.preferYarn)
    ? executeCommand(`yarn remove ${packageNames.join(' ')}`)
    : executeCommand(`npm uninstall ${packageNames.join(' ')} --save`);
}
