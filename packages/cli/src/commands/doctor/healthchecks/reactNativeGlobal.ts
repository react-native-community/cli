import {logger} from '@react-native-community/cli-tools';
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
  fs.unlink(reactNativeGlobalPath, () => {});
};

export default {
  label: label,
  getDiagnostics: async () => ({
    needsToBeFixed: checkGlobalInstall(),
  }),
  runAutomaticFix: automaticFix(),
} as HealthCheckInterface;
