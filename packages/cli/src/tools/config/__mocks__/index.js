/**
 * @flow
 */
import {type ConfigT} from '../types.flow';

export default function mockedLoadConfig(): ConfigT {
  return {
    root: '/project/root',
    reactNativePath: '',
    commands: [],
    platforms: {
      ios: {projectConfig: () => null, dependencyConfig: () => null},
      android: {projectConfig: () => null, dependencyConfig: () => null},
    },
    project: {
      ios: null,
      android: null,
    },
    dependencies: {},
    assets: [],
    haste: {
      providesModuleNodeModules: [],
      platforms: [],
    },
  };
}
