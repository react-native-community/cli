/**
 * @flow
 */

import type {
  DependencyParamsAndroidT,
  ProjectParamsAndroidT,
  ProjectParamsIOST,
  InquirerPromptT,
  DependencyConfigAndroidT,
  DependencyConfigIOST,
  ProjectConfigAndroidT,
  ProjectConfigIOST,
  PlatformsT,
} from '../types.flow';

/**
 * A map of hooks to run pre/post some of the CLI actions
 */
type HooksT = {
  [key: string]: string,
  prelink?: string,
  postlink?: string,
};

export type DependencyConfigT = {
  dependency: {
    platforms: {
      android?: DependencyParamsAndroidT,
      ios?: ProjectParamsIOST,
      [key: string]: any,
    },
    assets: string[],
    hooks: HooksT,
    params: InquirerPromptT[],
  },
  commands: string[],
  platforms: PlatformsT,
};

export type ConfigT = {|
  root: string,
  reactNativePath: string,
  project: {
    android: ?ProjectConfigAndroidT,
    ios: ?ProjectConfigIOST,
    [key: string]: any,
  },
  dependencies: {
    [key: string]: {
      platforms: {
        android?: DependencyConfigAndroidT | null,
        ios?: DependencyConfigIOST | null,
        [key: string]: any,
      },
      assets: string[],
      hooks: HooksT,
      params: InquirerPromptT[],
    },
  },
  platforms: PlatformsT,
  commands: string[],
  haste: {
    platforms: Array<string>,
    providesModuleNodeModules: Array<string>,
  },
|};

export type RawConfigT = {|
  ...ConfigT,
  reactNativePath: ?string,
|};

export type UserConfigT = {
  ...RawConfigT,
  project: {
    android?: ProjectParamsAndroidT,
    ios?: ProjectParamsIOST,
    [key: string]: any,
  },
};
