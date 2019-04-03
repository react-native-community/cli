/**
 * @flow
 */

/**
 * Opaque type that describes the Inquirer question format. Not typed, since we just
 * pass it directly to Inquirer. Validation is done with Joi in `schema.js`
 */
type InquirerPromptT = any;

/**
 * Settings that a library author can define in the configuration bundled with
 * dependency for Android
 *
 * See UserDependencyConfigT for details
 */
type DependencyParamsAndroidT = {
  sourceDir?: string,
  manifestPath?: string,
  packageImportPath?: string,
  packageInstance?: string,
};

/**
 * Settings that user can define in the project configuration for Android
 *
 * See UserConfigT for details
 */
type ProjectParamsAndroidT = {
  sourceDir?: string,
  manifestPath?: string,
  packageName?: string,
  packageFolder?: string,
  mainFilePath?: string,
  stringsPath?: string,
  settingsGradlePath?: string,
  assetsPath?: string,
  buildGradlePath?: string,
};

/**
 * Settings that user can define in the project configuration for iOS.
 * Same for dependency - we share the type.
 *
 * See UserDependencyConfigT and UserConfigT for details
 */
type ProjectParamsIOST = {
  project?: string,
  sharedLibraries?: string[],
  libraryFolder?: string,
};

/**
 * Final configuration object
 */
export type ConfigT = {|
  // Root where the configuration has been resolved from
  root: string,

  // Path to React Native source
  reactNativePath: string,

  // Object that contains configuration for a project (null, when platform not available)
  project: {
    android: ?ProjectConfigAndroidT,
    ios: ?ProjectConfigIOST,
    [key: string]: any,
  },

  // An array of assets as defined by the user
  assets: string[],

  // Map of the dependencies that are present in the project
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

  // Map of available platforms (built-ins and dynamically loaded)
  platforms: {
    [name: string]: any,
    ios: {
      projectConfig: (string, ProjectParamsIOST) => ?ProjectConfigIOST,
      dependencyConfig: (string, ProjectParamsIOST) => ?DependencyConfigIOST,
      linkConfig: () => {
        isInstalled: (
          ProjectConfigIOST,
          string,
          DependencyConfigIOST,
        ) => boolean,
        register: (
          string,
          DependencyConfigIOST,
          Object,
          ProjectConfigIOST,
        ) => void,
        unregister: (
          string,
          DependencyConfigIOST,
          ProjectConfigIOST,
          Array<DependencyConfigT>,
        ) => void,
        copyAssets: (string[], ProjectConfigIOST) => void,
        unlinkAssets: (string[], ProjectConfigIOST) => void,
      },
      android: {
        projectConfig: (
          string,
          ProjectParamsAndroidT,
        ) => ?ProjectConfigAndroidT,
        dependencyConfig: (
          string,
          DependencyParamsAndroidT,
        ) => ?DependencyConfigAndroidT,
        linkConfig: () => {
          isInstalled: (
            ProjectConfigAndroidT,
            string,
            DependencyConfigAndroidT,
          ) => boolean,
          register: (
            string,
            DependencyConfigAndroidT,
            Object,
            ProjectConfigAndroidT,
          ) => void,
          unregister: (
            string,
            DependencyConfigAndroidT,
            ProjectConfigAndroidT,
            Array<DependencyConfigT>,
          ) => void,
          copyAssets: (string[], ProjectConfigAndroidT) => void,
          unlinkAssets: (string[], ProjectConfigAndroidT) => void,
        },
      },
    },
  },

  // An array of commands that are present in 3rd party packages
  commands: string[],

  // Haste configuration resolved based on available plugins
  haste: {
    platforms: Array<string>,
    providesModuleNodeModules: Array<string>,
  },
|};

/**
 * Aliases
 */
export type DependencyConfigT = $PropertyType<
  $PropertyType<ConfigT, 'dependencies'>,
  '[key: string]',
>;
export type HooksT = $PropertyType<DependencyConfigT, 'hooks'>;
export type ProjectConfigT = $PropertyType<ConfigT, 'project'>;
export type PlatformsT = $PropertyType<ConfigT, 'platforms'>;

/**
 * Config defined by a developer for a library
 */
export type UserDependencyConfigT = {
  // Additional dependency settings
  dependency: {
    platforms: {
      android: DependencyParamsAndroidT,
      ios: ProjectParamsIOST,
      [key: string]: any,
    },
    assets: string[],
    hooks: HooksT,
    params: InquirerPromptT[],
  },

  // An array of commands that ship with the dependency
  commands: string[],

  // An array of extra platforms to load
  platforms: {
    [name: string]: any,
  },
};

/**
 * Config defined by a developer for the project
 */
export type UserConfigT = {
  /**
   * Shares some structure with ConfigT, except that haste, root, platforms
   * are calculated and can't be defined
   */
  ...$Diff<ConfigT, {haste: any, root: any, platforms: any}>,
  reactNativePath: ?string,

  // Additional project settings
  project: {
    android?: ProjectParamsAndroidT,
    ios?: ProjectParamsIOST,
    [key: string]: any,
  },
};

// The following types are used in untyped-parts of the codebase, so I am leaving them
// until we actually need them.
type ProjectConfigIOST = {};
type DependencyConfigIOST = ProjectConfigIOST;
type ProjectConfigAndroidT = {};
type DependencyConfigAndroidT = {};
