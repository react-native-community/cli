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

const packages = {
  reactNative: 'react-native',
  reactNativeCLI: 'react-native-cli',
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

const checkGlobalInstallalations = () => {
  //Returns an array of globally installed paths for rn and rncli both in yarn and npm
  const librariesGloballyInstalled = Object.keys(packages).map(packageKey =>
    Object.keys(packageManagers).map(packageManagerKey =>
      findGlobalPackage(
        packageManagers[packageManagerKey],
        packages[packageKey],
      ),
    ),
  );

  console.log('!!!!!!!!! libGLobInst: ' + librariesGloballyInstalled);

  // try {
  //   reactNativeGlobal = checkGlobalPaths(packages.reactNative);
  // } catch (error) {
  //   return null;
  // }

  // try {
  //   reactNativeCLIGlobal = checkGlobalPaths(packages.reactNativeCLI);
  //   logger.log('******Found r-n-cli: ' + reactNativeCLIGlobal);
  // } catch (error) {
  //   return null;
  // }

  return librariesGloballyInstalled || false;

  // return !!((reactNativeCLIGlobal || reactNativeGlobal) && true);
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
    needsToBeFixed: checkGlobalInstallalations(),
  }),
  runAutomaticFix: async ({loader}) => {
    loader.stop();

    let reactNativeYarnPath = '';
    let reactNativeCLIYarnPath = '';
    let reactNativeNpmPath = '';
    let reactNativeCLINpmPath = '';

    //-----Get global paths for both yarn and npm-------

    const globalPaths = checkGlobalInstallalations();

    globalPaths.forEach(path => {
      if (path.includes("node/") && path.includes("react-native/")) {

      }
    })

    try {
      reactNativeYarnPath = findGlobalPackage(
        packageManagers.yarn,
        packages.reactNative,
      );
    } catch (error) {
      return null;
    }

    try {
      reactNativeCLIYarnPath = findGlobalPackage(
        packageManagers.yarn,
        packages.reactNativeCLI,
      );
    } catch (error) {
      return null;
    }

    try {
      reactNativeNpmPath = findGlobalPackage(
        packageManagers.npm,
        packages.reactNative,
      );
    } catch (error) {
      return null;
    }

    try {
      reactNativeCLINpmPath = findGlobalPackage(
        packageManagers.npm,
        packages.reactNativeCLI,
      );
    } catch (error) {
      return null;
    }

    //----Check if paths are in global directories; if so, remove---

    // RN yarn and npm

    if (isPathInside(reactNativeYarnPath, globalDirectories.yarn.packages)) {
      await removeNodePackage(packages.reactNative, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativeNpmPath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      await removeNodePackage(packages.reactNative, 'npm', loader);
    }

    // RNcli yarn and npm

    if (isPathInside(reactNativeCLIYarnPath, globalDirectories.yarn.packages)) {
      await removeNodePackage(packages.reactNativeCLI, 'yarn', loader);
    }

    if (
      isPathInside(
        reactNativeCLINpmPath,
        fs.realpathSync(globalDirectories.npm.packages),
      )
    ) {
      await removeNodePackage(packages.reactNativeCLI, 'npm', loader);
    }
  },
} as HealthCheckInterface;
