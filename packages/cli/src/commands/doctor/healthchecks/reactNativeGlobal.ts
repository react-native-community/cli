import {HealthCheckInterface} from '../types';
import fs from 'fs';
import execa from 'execa';

import resolveGlobal from 'resolve-global';
import globalDirectories from 'global-dirs';
import isPathInside from 'is-path-inside';
import {logger} from '@react-native-community/cli-tools';

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

const removeNodePackage = (packageName, packageManager) => {
  logger.log("*********Removing package: " + packageName)
  packageManager === 'yarn'
    ? execa(`yarn global remove ${packageName}`)
    : execa(`npm uninstall -g ${packageName}`);
};

const automaticFix = () => {
  let reactNativePath = '';
  let reactNativeCLIPath = '';

  try {
    reactNativePath = resolveGlobal('react-native-cli');
    reactNativeCLIPath = resolveGlobal('react-native');
  } catch {}

  if (isPathInside(reactNativePath, globalDirectories.yarn.packages)) {
    removeNodePackage(reactNativePath, 'yarn');
  }

  if (
    isPathInside(
      reactNativePath,
      fs.realpathSync(globalDirectories.npm.packages),
    )
  ) {
    removeNodePackage(reactNativePath, 'npm');
  }

  if (isPathInside(reactNativeCLIPath, globalDirectories.yarn.packages)) {
    removeNodePackage(reactNativeCLIPath, 'yarn');
  }

  if (
    isPathInside(
      reactNativeCLIPath,
      fs.realpathSync(globalDirectories.npm.packages),
    )
  ) {
    removeNodePackage(reactNativeCLIPath, 'npm');
  }
};

export default {
  label: label,
  getDiagnostics: async () => ({
    needsToBeFixed: checkGlobalInstall(),
  }),
  runAutomaticFix: automaticFix(),
} as HealthCheckInterface;
