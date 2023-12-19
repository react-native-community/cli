/**
 * iOS platform files
 */

export {default as commands} from './commands';

export {
  findPodfilePaths,
  getArchitecture,
  installPods,
} from '@react-native-community/cli-platform-apple';

export {dependencyConfig, projectConfig} from './config';
