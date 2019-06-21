// @flow
import execa from 'execa';
import logger from './logger';
import {getYarnVersionIfAvailable, isProjectUsingYarn} from './yarn';

type Options = {|
  preferYarn?: boolean,
  silent?: boolean,
  cwd?: string,
|};

let projectDir;

const packageManagers = {
  yarn: {
    add: ['add'],
    addDev: ['add', '-D'],
    remove: ['remove'],
    install: ['install'],
  },
  npm: {
    add: ['install', '--save', '--save-exact'],
    addDev: ['install', '--save-dev', '--save-exact'],
    remove: ['uninstall', '--save'],
    install: ['install'],
  },
};

function configurePackageManager(
  packageNames: Array<string>,
  options?: Options,
  action: 'add' | 'addDev' | 'remove',
) {
  const pm = shouldUseYarn(options) ? 'yarn' : 'npm';
  const pmConfig = packageManagers[pm];

  const [executable, ...flags] = pmConfig[action];
  const args = [executable, ...packageNames, ...flags];
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
  return configurePackageManager(packageNames, options, 'add');
}

export function installDev(packageNames: Array<string>, options?: Options) {
  return configurePackageManager(packageNames, options, 'addDev');
}

export function uninstall(packageNames: Array<string>, options?: Options) {
  return configurePackageManager(packageNames, options, 'remove');
}

export function installAll(options?: Options) {
  const pm = shouldUseYarn(options) ? 'yarn' : 'npm';
  const pmConfig = packageManagers[pm];

  return executeCommand(pm, pmConfig.install, options);
}
