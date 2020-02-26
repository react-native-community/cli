import {HealthCheckInterface} from '../types';
import fs from 'fs';
import execa from 'execa';

import resolveGlobal from 'resolve-global';
import globalDirectories from 'global-dirs';
import isPathInside from 'is-path-inside';
import {logger} from '@react-native-community/cli-tools';
import {removeMessage, logError} from './common';

const label = 'react-native-cli';

const checkGlobalInstall = () => {
  let reactNativeCLIGlobal;
  let reactNativeGlobal;

  try {
    reactNativeGlobal = resolveGlobal('react-native');
    logger.log('******Found r-n');
  } catch (error) {
    console.log('Error, couldnt find r-n: ' + error);
  }

  try {
    reactNativeCLIGlobal = resolveGlobal('react-native-cli');
    logger.log('******Found r-n-cli');
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

    let reactNativePath = '';
    let reactNativeCLIPath = '';
    const reactNative = 'react-native';
    const reactNativeCLI = 'react-native-cli';

    try {
      reactNativePath = resolveGlobal('react-native');
      logger.log('******Found r-nPath: ' + reactNativePath);
    } catch (error) {
      console.log('Error, couldnt find r-n: ' + error);
    }

    try {
      reactNativeCLIPath = resolveGlobal('react-native-cli');
      logger.log('******Found r-nCLIPath: ' + reactNativeCLIPath);
    } catch (error) {
      console.log('Error, couldnt find r-n-cli: ' + error);
    }

    if (isPathInside(reactNativePath, globalDirectories.yarn.packages)) {
      console.log('******rnPath is inside yarn global directory, removing...');
      console.log('rnPath is: ' + reactNativePath);
      await removeNodePackage(reactNative, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativePath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      console.log('******rnPath is inside npm directory, removing...');
      console.log('rnPath is: ' + reactNativePath);
      await removeNodePackage(reactNative, 'npm', loader);
    }

    if (isPathInside(reactNativeCLIPath, globalDirectories.yarn.packages)) {
      console.log('******rnCLIPath is inside yarn directory, removing...');
      console.log('rnCLIPath is: ' + reactNativePath);
      await removeNodePackage(reactNativeCLI, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativeCLIPath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      console.log('******rnCLIPath is inside npm directory, removing...');
      console.log('rnCLIPath is: ' + reactNativePath);
      await removeNodePackage(reactNativeCLI, 'npm', loader);
    }
  },
} as HealthCheckInterface;
