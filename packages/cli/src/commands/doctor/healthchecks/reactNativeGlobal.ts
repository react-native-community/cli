import {HealthCheckInterface} from '../types';
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
  const librariesGloballyInstalled = Object.keys(packages)
    .map(packageKey =>
      Object.keys(packageManagers).map(packageManagerKey =>
        findGlobalPackage(
          packageManagers[packageManagerKey],
          packages[packageKey],
        ),
      ),
    )
    .filter(e => e != null);

  //Cant's use flat() in ts...? This is an alternative
  const flattenedArray = [].concat.apply([], librariesGloballyInstalled);

  console.log('!!!!!! ' + flattenedArray);

  return flattenedArray;
};

const removeNodePackage = async (packagePath, loader) => {
  console.log('******removing ' + packagePath);

  const packageManager = packagePath.includes('yarn') ? 'yarn' : 'npm';
  const packageName = packagePath.includes('react-native/')
    ? 'react-native'
    : 'react-native-cli';

  console.log('******* pM: ' + packageManager + ' pN: ' + packageName);

  try {
    // For some reason the execa statement is not being executed, but no error is thrown?
    packageManager === 'yarn'
      ? await execa('yarn', ['global', 'remove', packageName])
      : await execa('npm', ['uninstall', '--global', packageName]);
  } catch (error) {
    console.log('Failed to remove package: ' + error);
    const message = `Failed to uninstall ${packageName}, please try to uninstall the global ${packageName} package manually.`;

    console.log(error);

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
    needsToBeFixed: !!checkGlobalInstallalations(),
  }),
  runAutomaticFix: async ({loader}) => {
    loader.stop();

    const globalPaths = checkGlobalInstallalations();

    console.log('Global paths: ' + globalPaths);

    await globalPaths.map(
      async packagePath => await removeNodePackage(packagePath, loader),
    );
  },
} as HealthCheckInterface;
