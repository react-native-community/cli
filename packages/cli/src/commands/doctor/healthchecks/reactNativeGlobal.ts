import {HealthCheckInterface} from '../types';
import fs from 'fs';
import execa from 'execa';

import resolveGlobal from 'resolve-global';
import globalDirectories from 'global-dirs';
import isPathInside from 'is-path-inside';
import {logger} from '@react-native-community/cli-tools';
import {removeMessage, logError} from './common';

const label = 'react-native-cli';

const checkGlobalInstall = (): boolean => {
  let reactNativeCLIGlobal;
  let reactNativeGlobal;

  try {
    reactNativeCLIGlobal = resolveGlobal('react-native-cli');
    reactNativeGlobal = resolveGlobal('react-native');
  } catch {}
  return !!((reactNativeCLIGlobal || reactNativeGlobal) && true);
};

const removeNodePackage = async (packageName, packageManager, loader) => {
  logger.log('*********Removing package: ' + packageName);

  try {
    packageManager === 'yarn'
      ? await execa('yarn', ['global', 'remove', packageName])
      : await execa('npm', ['uninstall', '-g', packageName]);
  } catch (error) {
    console.log(error);

    const message = `Failed to uninstall ${packageName}, please try to uninstall the global ${packageName} package manually.`;

    logError({
      healthcheck: label,
      loader,
      error,
      message,
      command:
        packageManager === 'yarn'
          ? `yarn global remove ${packageName}`
          : `npm uninstall -g ${packageName}`,
    });
  }
};

export default {
  label: label,
  getDiagnostics: async () => ({
    needsToBeFixed: checkGlobalInstall(),
  }),
  runAutomaticFix: async ({loader}) => {
    loader.stop();

    let reactNativePath = '';
    let reactNativeCLIPath = '';
    const reactNative = 'reat-native';
    const reactNativeCLI = 'react-native-cli';

    try {
      reactNativePath = resolveGlobal('react-native-cli');
      reactNativeCLIPath = resolveGlobal('react-native');
    } catch {}

    if (isPathInside(reactNativePath, globalDirectories.yarn.packages)) {
      await removeNodePackage(reactNative, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativePath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      await removeNodePackage(reactNative, 'npm', loader);
    }

    if (isPathInside(reactNativeCLIPath, globalDirectories.yarn.packages)) {
      await removeNodePackage(reactNativeCLI, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativeCLIPath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      await removeNodePackage(reactNativeCLI, 'npm', loader);
    }
  },
} as HealthCheckInterface;
