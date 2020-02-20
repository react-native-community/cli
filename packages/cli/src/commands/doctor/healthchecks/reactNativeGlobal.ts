import {logger} from '@react-native-community/cli-tools';
import {HealthCheckInterface} from '../types';

const isInstalledGlobally = require('is-installed-globally');

const label = 'react-native-cli';

const checkGlobalInstall = (): boolean => {
  logger.log('Checking react-native-cli global install');
  return isInstalledGlobally('react-native-cli');
};

const automaticFix = () => {
  // Get the path of the directory of globally installed react-native-cli
  // Delete the directory of react-native-cli
};

export default {
  label: label,
  getDiagnostics: async () => ({
    needsToBeFixed: checkGlobalInstall(),
  }),
  runAutomaticFix: automaticFix(),
} as HealthCheckInterface;
