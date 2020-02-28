import {HealthCheckInterface} from '../types';
import fs from 'fs';
import execa from 'execa';

import globalDirectories from 'global-dirs';
import isPathInside from 'is-path-inside';
import {logger} from '@react-native-community/cli-tools';
import {logError} from './common';
import path from 'path';

const label = 'react-native global installation';

const packageManagers = {
  yarn: 'yarn',
  npm: 'npm',
};

const findGlobalPackage = (packageManager, moduleId) => {
  try {
    const modulePath = require.resolve(
      path.join(globalDirectories[packageManager].packages, moduleId),
    );
    return modulePath;
  } catch (error) {
    return '';
  }
};

const checkGlobalPaths = moduleId => {
  return !!(
    (findGlobalPackage(packageManagers.yarn, moduleId) ||
      findGlobalPackage(packageManagers.npm, moduleId)) &&
    true
  );
};

const checkGlobalInstall = () => {
  let reactNativeCLIGlobal;
  let reactNativeGlobal;

  try {
    reactNativeGlobal = checkGlobalPaths('react-native');
  } catch (error) {
    return null;
  }

  try {
    reactNativeCLIGlobal = checkGlobalPaths('react-native-cli');
    logger.log('******Found r-n-cli: ' + reactNativeCLIGlobal);
  } catch (error) {
    return null;
  }

  return !!((reactNativeCLIGlobal || reactNativeGlobal) && true);
};

const removeNodePackage = async (packageName, packageManager, loader) => {
  try {
    packageManager === 'yarn'
      ? await execa('yarn', ['global', 'remove', packageName])
      : await execa('npm', ['uninstall', '--global', packageName]);
  } catch (error) {
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

    let reactNativeYarnPath = '';
    let reactNativeCLIYarnPath = '';
    let reactNativeNpmPath = '';
    let reactNativeCLINpmPath = '';
    const reactNative = 'react-native';
    const reactNativeCLI = 'react-native-cli';

    //-----Get global paths for both yarn and npm-------
    try {
      reactNativeYarnPath = findGlobalPackage(
        packageManagers.yarn,
        reactNative,
      );
    } catch (error) {
      return null;
    }

    try {
      reactNativeCLIYarnPath = findGlobalPackage(
        packageManagers.yarn,
        reactNativeCLI,
      );
    } catch (error) {
      return null;
    }

    try {
      reactNativeNpmPath = findGlobalPackage(packageManagers.npm, reactNative);
    } catch (error) {
      return null;
    }

    try {
      reactNativeCLINpmPath = findGlobalPackage(
        packageManagers.npm,
        reactNativeCLI,
      );
    } catch (error) {
      return null;
    }

    //----Check if paths are in global directories; if so, remove---

    // RN yarn and npm

    if (isPathInside(reactNativeYarnPath, globalDirectories.yarn.packages)) {
      await removeNodePackage(reactNative, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativeNpmPath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      await removeNodePackage(reactNative, 'npm', loader);
    }

    // RNcli yarn and npm

    if (isPathInside(reactNativeCLIYarnPath, globalDirectories.yarn.packages)) {
      await removeNodePackage(reactNativeCLI, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativeCLINpmPath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      await removeNodePackage(reactNativeCLI, 'npm', loader);
    }
  },
} as HealthCheckInterface;
