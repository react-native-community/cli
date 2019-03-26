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
export type UserConfigT = ProjectUserConfigT & DependencyUserConfigT;

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
 * Project configuration after being processed by the loading mechanism
 */
export type ProjectConfigT = {
  reactNativePath: string,
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
 *
 * String format is deprecated and will be removed in the future.
 */
export type PlatformsT = {
  [key: string]:
    | string
    | {
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

/**
 * Configuration that ships with a dependency
 */
export type DependencyUserConfigT = {
  /**
   * Key that defines settings related to native code and linking
   */
  dependency?: {
    /**
     * Additional configuration for native code on per platform basis.
     * Useful to overwrite built-in heurstics in non-default setups
     */
    platforms?: {
      android?: ?AndroidConfigParamsT,
      ios?: ?IOSConfigParamsT,
      [key: string]: any,
    },
    assets?: AssetsT,
    hooks?: HooksT,
    params?: ParamsT,
  },
  commands?: CommandsT,
  platforms?: PlatformsT,
};

/**
 * Dependency configuration after being processed by the CLI
 */
export type DependencyConfigT = {
  /**
   * Dependency location on the disk
   */
  root: string,
  /**
   * An object containing configuration for each of the dependencies,
   * or null, if dependency does not support given platform
   */
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
  platform?: PlatformsT,
  /**
   * We don't read this configuration, but infer it from other properties.
   */
  haste?: MetroConfigT,
};

export type DependenciesConfigT = {
  dependencies: {
    [key: string]: DependencyConfigT,
  },
  /**
   * An array of platforms collected by parsing dependencies
   */
  platforms: PlatformsT,
  /**
   * An array of commands collected by parsing dependencies
   */
  commands: CommandsT,
  /**
   * Extra Metro configuration to use to support additonal platforms
   */
  haste: MetroConfigT,
};

export type ConfigT = ProjectConfigT &
  DependenciesConfigT & {
    root: string,
  };
