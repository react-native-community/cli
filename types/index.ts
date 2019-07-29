export interface Command {
  name: string;
  description?: string;
  func: (
    argv: Array<string>,
    ctx: Config,
    args: Object,
  ) => Promise<void> | void;
  options?: Array<{
    name: string,
    description?: string,
    parse?: (val: string) => any,
    default?:
      | string
      | boolean
      | number
      | ((ctx: Config) => string | boolean | number),
  }>;
  examples?: Array<{
    desc: string,
    cmd: string,
  }>;
}

export interface Config {
  // Root where the configuration has been resolved from
  root: string;

  // Path to React Native source
  reactNativePath: string;

  // Object that contains configuration for a project (null, when platform not available)
  project: {
    android?: ProjectConfigAndroid,
    ios?: ProjectConfigIOS | void,
    // [key: string]: ?Object,
  };

  // An array of assets as defined by the user
  assets: string[];

  // Map of the dependencies that are present in the project
  dependencies: {
    [key: string]: {
      name: string,
      root: string,
      platforms: {
        android?: DependencyConfigAndroid | null,
        ios?: DependencyConfigIOS | null,
        [key: string]: any,
      },
      assets: string[],
      hooks: {
        // [key: string]: string,
        prelink?: string,
        postlink?: string,
      },
      params: InquirerPromptT[],
    },
  };

  // Map of available platforms (built-ins and dynamically loaded)
  platforms: {
    // [name: string]: PlatformConfig<any, any, any, any>,
    ios?: PlatformConfig<
      ProjectParamsIOS,
      ProjectParamsIOS, // DependencyParams are the same as ProjectParams on iOS
      ProjectConfigIOS,
      DependencyConfigIOS,
    >,
    android?: PlatformConfig<
      ProjectParamsAndroid,
      DependencyParamsAndroid,
      ProjectConfigAndroid,
      DependencyConfigAndroid,
    >,
  };

  // An array of commands that are present in 3rd party packages
  commands: Command[];

  // Haste configuration resolved based on available plugins
  haste: {
    platforms: Array<string>,
    providesModuleNodeModules: Array<string>,
  };
}

interface PlatformConfig<
  ProjectParams,
  DependencyParams,
  ProjectConfig,
  DependencyConfig,
> {
  projectConfig: (
    projectRoot: string,
    projectParams: ProjectParams | void,
  ) => ProjectConfig | void;
  dependencyConfig: (
    dependency: string,
    params: DependencyParams,
  ) => DependencyConfig | void;
  linkConfig: () => {
    isInstalled: (
      projectConfig: ProjectConfig,
      packageName: string,
      dependencyConfig: DependencyConfig,
    ) => boolean,
    register: (
      name: string,
      dependencyConfig: DependencyConfig,
      params: Object,
      projectConfig: ProjectConfig,
    ) => void,
    unregister: (
      name: string,
      dependencyConfig: DependencyConfig,
      projectConfig: ProjectConfig,
      otherDependencies: Array<DependencyConfig>,
    ) => void,
    copyAssets: (assets: string[], projectConfig: ProjectConfig) => void,
    unlinkAssets: (assets: string[], projectConfig: ProjectConfig) => void,
  };
}

export interface ProjectConfigIOS {
  sourceDir: string;
  folder: string;
  pbxprojPath: string;
  podfile: null;
  podspecPath: null | string;
  projectPath: string;
  projectName: string;
  libraryFolder: string;
  sharedLibraries: Array<any>;
  plist: Array<any>;
}

export interface DependencyConfigIOS extends ProjectConfigIOS {}

export interface ProjectConfigAndroid {
  sourceDir: string;
  isFlat: boolean;
  folder: string;
  stringsPath: string;
  manifestPath: string;
  buildGradlePath: string;
  settingsGradlePath: string;
  assetsPath: string;
  mainFilePath: string;
  packageName: string;
}

export interface DependencyConfigAndroid {
  sourceDir: string;
  folder: string;
  packageImportPath: string;
  packageInstance: string;
}

/**
 * Opaque type that describes the Inquirer question format. Not typed, since we just
 * pass it directly to Inquirer. Validation is done with Joi in `schema.js`
 */
export type InquirerPromptT = any;

/**
 * Settings that a library author can define in the configuration bundled with
 * dependency for Android
 *
 * See UserDependencyConfigT for details
 */
export interface DependencyParamsAndroid {
  sourceDir?: string;
  manifestPath?: string;
  packageImportPath?: string;
  packageInstance?: string;
}

/**
 * Settings that user can define in the project configuration for Android
 *
 * See UserConfigT for details
 */
export interface ProjectParamsAndroid {
  sourceDir?: string;
  manifestPath?: string;
  packageName?: string;
  packageFolder?: string;
  mainFilePath?: string;
  stringsPath?: string;
  settingsGradlePath?: string;
  assetsPath?: string;
  buildGradlePath?: string;
}

/**
 * Settings that user can define in the project configuration for iOS.
 * Same for dependency - we share the type.
 *
 * See UserDependencyConfigT and UserConfigT for details
 */
interface ProjectParamsIOS {
  project?: string;
  podspecPath?: string;
  sharedLibraries?: string[];
  libraryFolder?: string;
  plist: any[];
}
