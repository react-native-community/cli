import {HealthCheckInterface} from '../types';
import fs from 'fs';
import isInstalledGlobally from 'is-installed-globally';
import resolveGlobal from 'resolve-global';

const label = 'react-native-cli';

const checkGlobalInstall = (): boolean => {
  return isInstalledGlobally('react-native-cli');
};

const automaticFix = async () => {
  const reactNativeGlobalPath = resolveGlobal('react-native-cli');
  fs.unlink(reactNativeGlobalPath, error => {
    if (error) {
      // Do something with error
    }
  });
};

export default {
  label: label,
  getDiagnostics: async () => ({
    needsToBeFixed: checkGlobalInstall(),
  }),
  runAutomaticFix: automaticFix(),
} as HealthCheckInterface;
