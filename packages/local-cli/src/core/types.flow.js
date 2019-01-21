/**
 * @flow
 */

/* eslint-disable flowtype/no-weak-types */

export type ContextT = {
  root: string,
};

export type LocalCommandT = {
  name: string,
  description?: string,
  usage?: string,
  func: (argv: Array<string>, ctx: ContextT, args: Object) => ?Promise<void>,
  options?: Array<{
    command: string,
    description?: string,
    parse?: (val: string) => any,
    default?: ((ctx: ContextT) => mixed) | mixed,
  }>,
  examples?: Array<{
    desc: string,
    cmd: string,
  }>,
};

type Package = {
  version: string,
  name: string,
};

/**
 * User can define command either as an object (RequiredCommandT) or
 * as an array of commands (Array<RequiredCommandT>).
 */
export type ProjectCommandT = LocalCommandT & {
  pkg: Package,
};

/**
 * Main type. Can be either local or a project command.
 */
export type CommandT = LocalCommandT | ProjectCommandT;

/**
 * Config of a single platform
 */
export type PlatformConfigT<ProjectConfigT, DependencyConfigT, ParamsT> = {
  projectConfig: (string, ParamsT) => ?ProjectConfigT,
  dependencyConfig: (string, ParamsT) => ?DependencyConfigT,
  /**
   * @todo(grabbou): This should not be part of the "core". It should be
   * specific to `link` and `unlink`. Remove it from here soon.
   */
  linkConfig: () => {
    /**
     * @todo(grabbou): Revert the arguments order to align with the rest
     */
    isInstalled: (ProjectConfigT, string, DependencyConfigT) => boolean,
    register: (string, DependencyConfigT, Object, ProjectConfigT) => void,
    unregister: (
      string,
      DependencyConfigT,
      ProjectConfigT,
      Array<DependencyConfigT>
    ) => void,
    copyAssets: (string[], ProjectConfigT) => void,
    unlinkAssets: (string[], ProjectConfigT) => void,
  },
};

/**
 * The following types will be useful when we type `link` itself. For now,
 * they can be treated as aliases.
 */
export type AndroidConfigParamsT = {};

export type IOSConfigParamsT = {};

export type ProjectConfigIOST = {};

export type DependencyConfigIOST = ProjectConfigIOST;

export type ProjectConfigAndroidT = {};

export type DependencyConfigAndroidT = {};

/**
 * Config of a project.
 *
 * When one of the projects is `null`, that means given platform
 * is not available in the current project.
 */
export type ProjectConfigT = {
  android: ?ProjectConfigAndroidT,
  ios: ?ProjectConfigIOST,
};

/**
 * Config of a dependency. Just like above, when one of the values is `null`,
 * given platform is not available.
 */
export type DependencyConfigT = {
  android: ?DependencyConfigAndroidT,
  ios: ?DependencyConfigIOST,
};

/**
 * Available platforms. Additional plugins should assert the type on their own.
 */
export type PlatformsT = {
  ios: PlatformConfigT<
    ProjectConfigIOST,
    DependencyConfigIOST,
    IOSConfigParamsT
  >,
  android: PlatformConfigT<
    ProjectConfigAndroidT,
    DependencyConfigAndroidT,
    AndroidConfigParamsT
  >,
  [name: string]: PlatformConfigT<any, any, any>,
};

export type InquirerPromptT = any;

/**
 * Configuration of the CLI as set by a package in the package.json
 */
export type PackageConfigurationT = {
  assets?: string[],
  commands?: { [name: string]: string },
  params?: InquirerPromptT[],
  android: AndroidConfigParamsT,
  ios: IOSConfigParamsT,
};
