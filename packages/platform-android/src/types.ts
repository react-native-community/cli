export type InquirerPromptT = any;

export interface Command {
  name: string;
  description?: string;
  func: (
    argv: Array<string>,
    ctx: Config,
    args: Object,
  ) => Promise<void> | void;
  options?: Array<{
    name: string;
    description?: string;
    parse?: (val: string) => any;
    default?:
      | string
      | boolean
      | number
      | ((ctx: Config) => string | boolean | number);
  }>;
  examples?: Array<{
    desc: string;
    cmd: string;
  }>;
}

interface PlatformConfig<
  ProjectParams,
  DependencyParams,
  ProjectConfig,
  DependencyConfig
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
    ) => boolean;
    register: (
      name: string,
      dependencyConfig: DependencyConfig,
      params: Object,
      projectConfig: ProjectConfig,
    ) => void;
    unregister: (
      name: string,
      dependencyConfig: DependencyConfig,
      projectConfig: ProjectConfig,
      otherDependencies: Array<DependencyConfig>,
    ) => void;
    copyAssets: (assets: string[], projectConfig: ProjectConfig) => void;
    unlinkAssets: (assets: string[], projectConfig: ProjectConfig) => void;
  };
}
/**
 * @property root - Root where the configuration has been resolved from
 * @property reactNativePath - Path to React Native source
 * @property project - Object that contains configuration for a project (null, when platform not available)
 * @property assets - An array of assets as defined by the user
 * @property dependencies - Map of the dependencies that are present in the project
 * @property platforms - Map of available platforms (build-ins and dynamically loaded)
 * @property commands - An array of commands that are present in 3rd party packages
 * @property haste - Haste configuration resolved based on available plugins
 */
export interface Config {
  root: string;
  reactNativePath: string;
  project: {
    android?: ProjectConfigAndroid;
    [key: string]: any;
  };
  assets: string[];
  dependencies: {
    [key: string]: {
      name: string;
      root: string;
      platforms: {
        android?: DependencyConfigAndroid | null;
        [key: string]: any;
      };
      assets: string[];
      hooks: {
        prelink?: string;
        postlink?: string;
      };
      params: InquirerPromptT[];
    };
  };
  platforms: {
    android: PlatformConfig<
      ProjectParamsAndroid,
      DependencyParamsAndroid,
      ProjectConfigAndroid,
      DependencyConfigAndroid
    >;
    [name: string]: PlatformConfig<any, any, any, any>;
  };
  commands: Command[];
  haste: {
    platforms: Array<string>;
    providesModuleNodeModules: Array<string>;
  };
}

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

export interface DependencyConfigAndroid {
  sourceDir: string;
  folder: string;
  packageImportPath: string;
  packageInstance: string;
}

export interface DependencyParamsAndroid {
  packageName?: string;
  sourceDir?: string;
  manifestPath?: string;
  packageImportPath?: string;
  packageInstance?: string;
}
