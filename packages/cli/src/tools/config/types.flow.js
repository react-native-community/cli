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
 * Depending on the context, the configuration of the CLI can have both configurations
 * within.
 */
export type UserConfigT = ProjectUserConfigT &
  DependenciesUserConfigT &
  DependencyUserConfigT;

/**
 * Configuration that ships with a project
 */
export type ProjectUserConfigT = {
  /**
   * A path to a React Native module. Useful, when running from source and there's
   * no "react-native" module that `require` can resolve.
   */
  reactNativePath?: string,
};

/**
 * An array of assets defined by a library to link to a project
 */
type AssetsT = Array<string>;

/**
 * A map of hooks to run pre/post some of the CLI actions
 */
type HooksT = {
  [key: string]: string,
  prelink?: string,
  postlink?: string,
};

/**
 * Params to ask during linking process if library requires additional
 * configuration
 */
type ParamsT = InquirerPromptT[];

/**
 * Defines an array of commands that a dependency can add to a React Native CLI
 */
type CommandsT = Array<string>;

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

/**
 * Metro-related configuration to define to make 3rd party platforms
 * work.
 */
type MetroConfigT = {
  platforms: Array<string>,
  providesModuleNodeModules: Array<string>,
};

export type DependencyUserConfigT = {
  dependency: {
    platforms: {
      android?: AndroidConfigParamsT,
      ios?: IOSConfigParamsT,
      [key: string]: any,
    },
    assets: AssetsT,
    hooks: HooksT,
    params: ParamsT,
  },
  commands: CommandsT,
  platforms: PlatformsT,
};

export type ProjectConfigT = {
  root: string,
  reactNativePath: string,
  dependencies: {
    [key: string]: {
      platforms: {
        android: DependencyConfigAndroidT | null,
        ios: DependencyConfigIOST | null,
        [key: string]: any,
      },
      assets: AssetsT,
      hooks: HooksT,
      params: ParamsT,
    },
  },
  platforms: PlatformsT,
  commands: CommandsT,
  haste: MetroConfigT,
};

/**
 * Dependency configuration after being processed by the CLI
 */
export type DependencyConfigT = {
  platforms: {
    android: DependencyConfigAndroidT | null,
    ios: DependencyConfigIOST | null,
    [key: string]: any,
  },
  assets: AssetsT,
  hooks: HooksT,
  params: ParamsT,
};

/**
 * Legacy configuration that can be defined in package.json,
 * under "rnpm" key.
 */
export type LegacyDependencyUserConfigT = {
  /**
   * See DependencyUserConfigT.dependency.assets
   */
  assets?: AssetsT,
  /**
   * See DependencyUserConfigT.dependency.hooks
   */
  commands?: HooksT,
  /**
   * See DependencyUserConfigT.dependency.params
   */
  params?: ParamsT,
  /**
   * See DependencyUserConfigT.dependency.platforms.android
   */
  android?: ?AndroidConfigParamsT,
  /**
   * See DependencyUserConfigT.dependency.platforms.ios
   */
  ios?: ?IOSConfigParamsT,
  /**
   * See DependencyUserConfigT.commands
   */
  plugin?: string | CommandsT,
  /**
   * See DependencyUserConfigT.platforms
   */
  platform?: string,
  /**
   * We don't read this configuration, but infer it from other properties.
   */
  haste?: MetroConfigT,
};

/**
 * Users can override "DependenciesConfigT" that we have automatically generated
 * during the CLI startup
 */
export type DependenciesUserConfigT = {
  dependencies?: {
    [key: string]: ?DependencyConfigT,
  },
  platforms?: PlatformsT,
  commands?: CommandsT,
  haste?: MetroConfigT,
};

export type ConfigT = ProjectConfigT;
