import execa from 'execa';
import {getYarnVersionIfAvailable, isProjectUsingYarn} from './yarn';
import {getBunVersionIfAvailable, isProjectUsingBun} from './bun';
import {getNpmVersionIfAvailable, isProjectUsingNpm} from './npm';
import logger from './logger';

export type PackageManager = keyof typeof packageManagers;

type Options = {
  packageManager: PackageManager;
  silent?: boolean;
  root: string;
};

const packageManagers = {
  yarn: {
    init: ['init', '-y'],
    install: ['add'],
    installDev: ['add', '-D'],
    uninstall: ['remove'],
    installAll: ['install'],
  },
  npm: {
    init: ['init', '-y'],
    install: ['install', '--save', '--save-exact'],
    installDev: ['install', '--save-dev', '--save-exact'],
    uninstall: ['uninstall', '--save'],
    installAll: ['install'],
  },
  bun: {
    init: ['init', '-y'],
    install: ['add', '--exact'],
    installDev: ['add', '--dev', '--exact'],
    uninstall: ['remove'],
    installAll: ['install'],
  },
};

function configurePackageManager(
  packageNames: Array<string>,
  action: 'init' | 'install' | 'installDev' | 'installAll' | 'uninstall',
  options: Options,
) {
  let pm: PackageManager = shouldUseYarn(options) ? 'yarn' : 'npm';
  if (options.packageManager === 'bun') {
    pm = shouldUseBun(options) ? 'bun' : 'npm';
  }

  const [executable, ...flags] = packageManagers[pm][action];
  const args = [executable, ...flags, ...packageNames];
  return executeCommand(pm, args, options);
}

function executeCommand(
  command: string,
  args: Array<string>,
  options: Options,
) {
  return execa(command, args, {
    stdio: options.silent && !logger.isVerbose() ? 'pipe' : 'inherit',
    cwd: options.root,
  });
}

export function shouldUseYarn(options: Options) {
  if (options.packageManager === 'yarn') {
    return getYarnVersionIfAvailable();
  }
  return isProjectUsingYarn(options.root) && getYarnVersionIfAvailable();
}

export function shouldUseBun(options: Options) {
  if (options.packageManager === 'bun') {
    return getBunVersionIfAvailable();
  }

  return isProjectUsingBun(options.root) && getBunVersionIfAvailable();
}

export function shouldUseNpm(options: Options) {
  if (options.packageManager === 'npm') {
    return getNpmVersionIfAvailable();
  }

  return isProjectUsingNpm(options.root) && getNpmVersionIfAvailable();
}

export function init(options: Options) {
  return configurePackageManager([], 'init', options);
}

export function install(packageNames: Array<string>, options: Options) {
  return configurePackageManager(packageNames, 'install', options);
}

export function installDev(packageNames: Array<string>, options: Options) {
  return configurePackageManager(packageNames, 'installDev', options);
}

export function uninstall(packageNames: Array<string>, options: Options) {
  return configurePackageManager(packageNames, 'uninstall', options);
}

export function installAll(options: Options) {
  return configurePackageManager([], 'installAll', options);
}
