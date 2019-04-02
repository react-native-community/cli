/**
 * @flow
 */

import type {
  AndroidConfigParamsT,
  IOSConfigParamsT,
  InquirerPromptT,
  DependencyConfigAndroidT,
  DependencyConfigIOST,
  ProjectConfigAndroidT,
  ProjectConfigIOST,
} from '../types.flow';

/**
 * A map of hooks to run pre/post some of the CLI actions
 */
type HooksT = {
  [key: string]: string,
  prelink?: string,
  postlink?: string,
};

/**
 * A map with additional platforms that ship with a dependency.
 */
export type PlatformsT = {
  [key: string]: {
    dependencyConfig?: Function,
    projectConfig?: Function,
    linkConfig?: Function,
  },
};

export type DependencyConfigT = {
  dependency: {
    platforms: {
      android?: AndroidConfigParamsT,
      ios?: IOSConfigParamsT,
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
    android?: ProjectConfigAndroidT,
    ios?: ProjectConfigIOST,
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
    android?: AndroidConfigParamsT,
    ios?: IOSConfigParamsT,
    [key: string]: any,
  },
};
