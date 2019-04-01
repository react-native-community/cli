/**
 * @flow
 */

import type {
  AndroidConfigParamsT,
  IOSConfigParamsT,
  InquirerPromptT,
  DependencyConfigAndroidT,
  DependencyConfigIOST,
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

type _ProjectConfigT = {
  root: string,
  reactNativePath: string,
  dependencies: {
    [key: string]: {
      platforms: {
        android: DependencyConfigAndroidT | null,
        ios: DependencyConfigIOST | null,
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
};

export type TemporaryProjectConfigT = {
  ..._ProjectConfigT,
  reactNativePath: string | null,
};

export type ProjectConfigT = _ProjectConfigT & {
  reactNativePath: string,
};
