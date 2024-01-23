import {
  getDependencyConfig,
  getProjectConfig,
} from '@react-native-community/cli-platform-apple';

export const dependencyConfig = getDependencyConfig({platformName: 'ios'});
export const projectConfig = getProjectConfig({platformName: 'ios'});
