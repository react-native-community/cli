// @flow
import execa from 'execa';
import {logger} from '@react-native-community/cli-tools';
// $FlowFixMe - converted to TS
import {getYarnVersionIfAvailable, isProjectUsingYarn} from './yarn';

type Options = {|
  preferYarn?: boolean,
  silent?: boolean,
  cwd?: string,
|};

let projectDir;

const packageManagers = {
  yarn: {
    install: ['add'],
    installDev: ['add', '-D'],
    uninstall: ['remove'],
    installAll: ['install'],
  },
  npm: {
    install: ['install', '--save', '--save-exact'],
    installDev: ['install', '--save-dev', '--save-exact'],
    uninstall: ['uninstall', '--save'],
    installAll: ['install'],
  },
};

function configurePackageManager(
  packageNames: Array<string>,
  options?: Options,
  action: 'install' | 'installDev' | 'installAll' | 'uninstall',
) {
  const pm = shouldUseYarn(options) ? 'yarn' : 'npm';
  const [executable, ...flags] = packageManagers[pm][action];
  const args = [executable, ...flags, ...packageNames];
  return executeCommand(pm, args, options);
}

function executeCommand(
  command: string,
  args: Array<string>,
  options?: Options,
) {
  return execa(command, args, {
    stdio:
      options && options.silent && !logger.isVerbose() ? 'pipe' : 'inherit',
    cwd: options && options.cwd,
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
  return configurePackageManager(packageNames, options, 'install');
}

export function installDev(packageNames: Array<string>, options?: Options) {
  return configurePackageManager(packageNames, options, 'installDev');
}

export function uninstall(packageNames: Array<string>, options?: Options) {
  return configurePackageManager(packageNames, options, 'uninstall');
}

export function installAll(options?: Options) {
  return configurePackageManager([], options, 'installAll');
}
