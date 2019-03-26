/**
 * @flow
 */

import type {
  AndroidConfigParamsT,
  IOSConfigParamsT,
  InquirerPromptT,
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
    /**
     * An array of assets defined by a library to link to a project
     */
    assets?: Array<string>,
    /**
     * A map of hooks to run pre/post some of the CLI actions
     */
    hooks?: {
      [key: string]: string,
      prelink?: string,
      postlink?: string,
    },
    /**
     * Params to ask during linking process if library requires additional
     * configuration
     */
    params?: InquirerPromptT[],
  },
  /**
   * Defines an array of commands that a dependency can add to a React Native CLI
   */
  commands?: Array<string>,
  /**
   * A map with additional platforms that ship with a dependency.
   *
   * String format is deprecated and will be removed in the future.
   */
  platforms?: {
    [key: string]: string,
  },
};

/**
 * Legacy configuration that can be defined in package.json,
 * under "rnpm" key.
 */
export type LegacyDependencyUserConfigT = {
  /**
   * See DependencyUserConfigT.dependency.assets
   */
  assets?: Array<string>,
  /**
   * See DependencyUserConfigT.dependency.hooks
   */
  commands?: {[name: string]: string},
  /**
   * See DependencyUserConfigT.dependency.params
   */
  params?: InquirerPromptT[],
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
  plugin?: string | Array<string>,
  /**
   * See DependencyUserConfigT.platforms
   */
  platform?: string,
  /**
   * Metro-related configuration to define to make 3rd party platforms
   * work.
   *
   * We don't read this configuration, but infer it from other properties.
   */
  haste?: {
    platforms: Array<string>,
    providesModuleNodeModules: Array<string>,
  },
};
