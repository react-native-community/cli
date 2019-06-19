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

const yarnConfig = {
	'dependencies': ['add'],
	'devDependencies': ['add', '-D'],
	'uninstallDependencies': ['remove']
};

const npmConfig = {
	'dependencies': ['install', '--save', '--save-exact'],
	'devDependencies': ['install', '--save-dev', '--save-exact'],
	'uninstallDependencies': ['uninstall', '--save']
};

function configurePackageManager(
	pmIsYarn: boolean,
	packageNames: Array<string>,
	options?: Options, args: string
) {
  const pm = pmIsYarn ? 'yarn' : 'npm';
  const pmConfig = pm === 'npm' ? npmConfig : yarnConfig;

  let args = pmConfig[args];
  args.push(...packageNames);
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
  configurePackageManager(shouldUseYarn(options), packageNames, options, 'dependencies');
}

export function installDev(packageNames: Array<string>, options?: Options) {
  configurePackageManager(shouldUseYarn(options), packageNames, options, 'devDependencies');
}

export function uninstall(packageNames: Array<string>, options?: Options) {
  configurePackageManager(shouldUseYarn(options), packageNames, options, 'uninstallDependencies');
}

export function installAll(options?: Options) {
  const pm = shouldUseYarn(options) ? 'yarn': 'npm';
  return executeCommand(pm, ['install'], options);
}
