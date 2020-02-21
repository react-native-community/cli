import {HealthCheckInterface} from '../types';
import fs from 'fs';

import resolveGlobal from 'resolve-global';

const label = 'react-native-cli';

const checkGlobalInstall = (): boolean => {
  const reactNativeCLIGlobal = resolveGlobal('react-native-cli');
  const reactNativeGlobal = resolveGlobal('react-native');
  return !!((reactNativeCLIGlobal || reactNativeGlobal) && true);
};

const automaticFix = () => {
  
};

export default {
  label: label,
  getDiagnostics: async () => ({
    needsToBeFixed: checkGlobalInstall(),
  }),
  runAutomaticFix: automaticFix(),
} as HealthCheckInterface;
