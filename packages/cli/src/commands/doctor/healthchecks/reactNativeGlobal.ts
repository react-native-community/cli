import {HealthCheckInterface} from '../types';
import fs from 'fs';
import execa from 'execa';

import globalDirectories from 'global-dirs';
import isPathInside from 'is-path-inside';
import {logger} from '@react-native-community/cli-tools';
import {logError} from './common';
import path from 'path';

const label = 'react-native/react-native-cli globally installed';

const resolveGlobalYarnPackage = moduleId => {
  try {
    const modulePath = require.resolve(
      path.join(globalDirectories.yarn.packages, moduleId),
    );
    console.log('Global yarn path: ' + modulePath);
    return modulePath;
  } catch (error) {
    console.log('Error resolving global yarn package: ' + error);
    return '';
  }
};

const resolveGlobalNpmPackage = moduleId => {
  try {
    const modulePath = require.resolve(
      path.join(globalDirectories.npm.packages, moduleId),
    );
    console.log('Global yarn path: ' + modulePath);
    return modulePath;
  } catch (error) {
    console.log('Error resolving global yarn package: ' + error);
    return '';
  }
};

const checkGlobalPaths = moduleId => {
  return !!(
    (resolveGlobalYarnPackage(moduleId) || resolveGlobalNpmPackage(moduleId)) &&
    true
  );
};

const checkGlobalInstall = () => {
  let reactNativeCLIGlobal;
  let reactNativeGlobal;

  try {
    reactNativeGlobal = checkGlobalPaths('react-native');
    logger.log('******Found r-n: ' + reactNativeGlobal);
  } catch (error) {
    console.log('Error, couldnt find r-n: ' + error);
  }

  try {
    reactNativeCLIGlobal = checkGlobalPaths('react-native-cli');
    logger.log('******Found r-n-cli: ' + reactNativeCLIGlobal);
  } catch (error) {
    console.log('Error, couldnt find r-n-cli: ' + error);
  }

  return !!((reactNativeCLIGlobal || reactNativeGlobal) && true);
};

const removeNodePackage = async (packageName, packageManager, loader) => {
  logger.log(
    '*********Removing package: ' + packageName + ' from: ' + packageManager,
  );

  try {
    packageManager === 'yarn'
      ? await execa('yarn', ['global', 'remove', packageName])
      : await execa('npm', ['uninstall', '--global', packageName]);
    logger.log('!!!!!!Successfully Removed package: ' + packageName);
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

    let reactNativeYarnPath = '';
    let reactNativeCLIYarnPath = '';
    let reactNativeNpmPath = '';
    let reactNativeCLINpmPath = '';
    const reactNative = 'react-native';
    const reactNativeCLI = 'react-native-cli';

    //-----Get global paths for both yarn and npm-------
    try {
      reactNativeYarnPath = resolveGlobalYarnPackage('react-native');
      logger.log('******Found r-nPath: ' + reactNativeYarnPath);
    } catch (error) {
      console.log('Error, couldnt find r-n: ' + error);
    }

    try {
      reactNativeCLIYarnPath = resolveGlobalYarnPackage('react-native-cli');
      logger.log('******Found r-nCLIPath: ' + reactNativeCLIYarnPath);
    } catch (error) {
      console.log('Error, couldnt find r-n-cli: ' + error);
    }

    try {
      reactNativeNpmPath = resolveGlobalNpmPackage('react-native');
      logger.log('******Found r-nPath: ' + reactNativeYarnPath);
    } catch (error) {
      console.log('Error, couldnt find r-n: ' + error);
    }

    try {
      reactNativeCLINpmPath = resolveGlobalNpmPackage('react-native-cli');
      logger.log('******Found r-nCLIPath: ' + reactNativeCLIYarnPath);
    } catch (error) {
      console.log('Error, couldnt find r-n-cli: ' + error);
    }

    //----Check if paths are in global directories; if so, remove---

    // RN yarn and npm

    if (isPathInside(reactNativeYarnPath, globalDirectories.yarn.packages)) {
      console.log('******rnPath is inside yarn global directory, removing...');
      console.log('rnPath is: ' + reactNativeYarnPath);
      await removeNodePackage(reactNative, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativeNpmPath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      console.log('******rnPath is inside npm directory, removing...');
      console.log('rnPath is: ' + reactNativeNpmPath);
      await removeNodePackage(reactNative, 'npm', loader);
    }

    // RNcli yarn and npm

    if (isPathInside(reactNativeCLIYarnPath, globalDirectories.yarn.packages)) {
      console.log('******rnCLIPath is inside yarn directory, removing...');
      console.log('rnCLIPath is: ' + reactNativeCLIYarnPath);
      await removeNodePackage(reactNativeCLI, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativeCLINpmPath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      console.log('******rnCLIPath is inside npm directory, removing...');
      console.log('rnCLIPath is: ' + reactNativeCLINpmPath);
      await removeNodePackage(reactNativeCLI, 'npm', loader);
    }
  },
} as HealthCheckInterface;
