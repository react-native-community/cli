import {HealthCheckInterface} from '../types';
import fs from 'fs';
import execa from 'execa';

import resolveGlobal from 'resolve-global';
import globalDirectories from 'global-dirs';
import isPathInside from 'is-path-inside';

const label = 'react-native-cli';

const checkGlobalInstall = (): boolean => {
  const reactNativeCLIGlobal = resolveGlobal('react-native-cli');
  const reactNativeGlobal = resolveGlobal('react-native');
  return !!((reactNativeCLIGlobal || reactNativeGlobal) && true);
};

const removeNodePackage = (packageName, packageManager) => {
  packageManager === 'yarn'
    ? execa(`yarn global remove ${packageName}`)
    : execa(`npm uninstall -g ${packageName}`);
};

const automaticFix = () => {
  const reactNativePath = globalDirectories('react-native-cli');
  const reactNativeCLIPath = globalDirectories('react-native');

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
