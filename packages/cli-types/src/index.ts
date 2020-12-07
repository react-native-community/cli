import {
  IOSProjectConfig,
  IOSProjectParams,
  IOSDependencyConfig,
  IOSDependencyParams,
  IOSNativeModulesConfig,
} from './ios';
import {
  AndroidProjectConfig,
  AndroidProjectParams,
  AndroidDependencyConfig,
  AndroidDependencyParams,
} from './android';
import {Ora} from 'ora';

export type Prompt = any;

export type CommandFunction<Args = Object> = (
  argv: Array<string>,
  ctx: Config,
  args: Args,
) => Promise<void> | void;

export type OptionValue = string | boolean | number;

export type CommandOption<T = (ctx: Config) => OptionValue> = {
  name: string;
  description?: string;
  parse?: (val: string) => any;
  default?: OptionValue | T;
};

export type DetachedCommandFunction<Args = Object> = (
  argv: string[],
  args: Args,
) => Promise<void> | void;

export type Command<IsDetached extends boolean = false> = {
  name: string;
  description?: string;
  detached?: IsDetached;
  examples?: Array<{
    desc: string;
    cmd: string;
  }>;
  pkg?: {
    name: string;
    version: string;
  };
  func: IsDetached extends true
    ? DetachedCommandFunction<Object>
    : CommandFunction<Object>;
  options?: Array<
    CommandOption<
      IsDetached extends true ? () => OptionValue : (ctx: Config) => OptionValue
    >
  >;
};

export type DetachedCommand = Command<true>;

interface PlatformConfig<
  ProjectConfig,
  ProjectParams,
  DependencyConfig,
  DependencyParams
> {
  npmPackageName?: string;
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

export interface Dependency {
  name: string;
  root: string;
  platforms: {
    android?: AndroidDependencyConfig | null;
    ios?: IOSDependencyConfig | null;
    [key: string]: any;
  };
  assets: string[];
  hooks: {
    prelink?: string;
    postlink?: string;
    preunlink?: string;
    postunlink?: string;
  };
  params: Prompt[];
}

export type ProjectConfig = {
  android?: AndroidProjectConfig;
  ios?: IOSProjectConfig;
  [key: string]: any;
};

export type NotFound = 'Not Found';
type AvailableInformation = {
  version: string;
  path: string;
};

type Information = AvailableInformation | NotFound;

export type EnvironmentInfo = {
  System: {
    OS: string;
    CPU: string;
    Memory: string;
    Shell: AvailableInformation;
  };
  Binaries: {
    Node: AvailableInformation;
    Yarn: AvailableInformation;
    npm: AvailableInformation;
    Watchman: AvailableInformation;
  };
  SDKs: {
    'iOS SDK': {
      Platforms: string[];
    };
    'Android SDK':
      | {
          'API Levels': string[] | NotFound;
          'Build Tools': string[] | NotFound;
          'System Images': string[] | NotFound;
          'Android NDK': string | NotFound;
        }
      | NotFound;
  };
  IDEs: {
    'Android Studio': AvailableInformation | NotFound;
    Emacs: AvailableInformation;
    Nano: AvailableInformation;
    VSCode: AvailableInformation;
    Vim: AvailableInformation;
    Xcode: AvailableInformation;
  };
  Languages: {
    Java: Information;
  };
};

export type HealthCheckCategory = {
  label: string;
  healthchecks: HealthCheckInterface[];
};

export type Healthchecks = {
  common: HealthCheckCategory;
  android: HealthCheckCategory;
  ios?: HealthCheckCategory;
};

export type RunAutomaticFix = (args: {
  loader: Ora;
  logManualInstallation: ({
    healthcheck,
    url,
    command,
    message,
  }: {
    healthcheck?: string;
    url?: string;
    command?: string;
    message?: string;
  }) => void;
  environmentInfo: EnvironmentInfo;
}) => Promise<void> | void;

export type HealthCheckInterface = {
  label: string;
  visible?: boolean | void;
  isRequired?: boolean;
  description?: string;
  getDiagnostics: (
    environmentInfo: EnvironmentInfo,
  ) => Promise<{
    version?: string;
    versions?: [string];
    versionRange?: string;
    needsToBeFixed: boolean | string;
  }>;
  win32AutomaticFix?: RunAutomaticFix;
  darwinAutomaticFix?: RunAutomaticFix;
  linuxAutomaticFix?: RunAutomaticFix;
  runAutomaticFix: RunAutomaticFix;
};

/**
 * @property root - Root where the configuration has been resolved from
 * @property reactNativePath - Path to React Native source
 * @property project - Object that contains configuration for a project (null, when platform not available)
 * @property assets - An array of assets as defined by the user
 * @property dependencies - Map of the dependencies that are present in the project
 * @property platforms - Map of available platforms (build-ins and dynamically loaded)
 * @property commands - An array of commands that are present in 3rd party packages
 * @property healthChecks - An array of health check categories to add to doctor command
 */
export interface Config extends IOSNativeModulesConfig {
  root: string;
  reactNativePath: string;
  project: ProjectConfig;
  assets: string[];
  dependencies: {[key: string]: Dependency};
  platforms: {
    android: PlatformConfig<
      AndroidProjectConfig,
      AndroidProjectParams,
      AndroidDependencyConfig,
      AndroidDependencyParams
    >;
    ios: PlatformConfig<
      IOSProjectConfig,
      IOSProjectParams,
      IOSDependencyConfig,
      IOSDependencyParams
    >;
    [name: string]: PlatformConfig<any, any, any, any>;
  };
  commands: Command[];
  healthChecks: HealthCheckCategory[];
}

/**
 * Shares some structure with Config, except that root is calculated and can't
 * be defined
 */

export type UserConfig = Omit<Config, 'root'> & {
  reactNativePath: string | void;
  // Additional project settings
  project: {
    android?: AndroidProjectParams;
    ios?: IOSProjectParams;
    [key: string]: any;
  };
};

export type UserDependencyConfig = {
  // Additional dependency settings
  dependency: Omit<Dependency, 'name' | 'root'>;
  // An array of commands that ship with the dependency
  commands: Command[];
  // An array of extra platforms to load
  platforms: Config['platforms'];
  // Additional health checks
  healthChecks: HealthCheckCategory[];
};

export {
  IOSProjectConfig,
  IOSProjectParams,
  IOSDependencyConfig,
  IOSDependencyParams,
  IOSNativeModulesConfig,
};

export {
  AndroidProjectConfig,
  AndroidProjectParams,
  AndroidDependencyConfig,
  AndroidDependencyParams,
};
