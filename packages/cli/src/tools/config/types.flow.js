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
  PlatformConfigT,
} from '../types.flow';

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
      name: string,
      platforms: {
        android?: DependencyConfigAndroidT | null,
        ios?: DependencyConfigIOST | null,
        [key: string]: any,
      },
      assets: string[],
      hooks: {
        [key: string]: string,
        prelink?: string,
        postlink?: string,
      },
      params: InquirerPromptT[],
    },
  },
  platforms: {
    ios: PlatformConfigT<
      ProjectConfigIOST,
      ProjectParamsIOST,
      DependencyConfigIOST,
      ProjectParamsIOST,
    >,
    android: PlatformConfigT<
      ProjectConfigAndroidT,
      ProjectParamsAndroidT,
      DependencyConfigAndroidT,
      DependencyParamsAndroidT,
    >,
    [name: string]: PlatformConfigT<any, any, any, any>,
  },
  commands: string[],
  haste: {
    platforms: Array<string>,
    providesModuleNodeModules: Array<string>,
  },
|};

export type DependencyConfigT = $PropertyType<
  $PropertyType<ConfigT, 'dependencies'>,
  '[key: string]',
>;

export type HooksT = $PropertyType<DependencyConfigT, 'hooks'>;

export type ProjectConfigT = $PropertyType<ConfigT, 'project'>;

export type PlatformsT = $PropertyType<ConfigT, 'platforms'>;

export type UserDependencyConfigT = {
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
