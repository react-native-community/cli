import {
  IOSProjectConfig,
  IOSProjectParams,
  IOSDependencyConfig,
  IOSDependencyParams,
  IOSProjectInfo,
} from './ios';
import {
  AndroidProjectConfig,
  AndroidProjectParams,
  AndroidDependencyConfig,
  AndroidDependencyParams,
} from './android';

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
}

type AndroidPlatformConfig = PlatformConfig<
  AndroidProjectConfig,
  AndroidProjectParams,
  AndroidDependencyConfig,
  AndroidDependencyParams
>;

type IOSPlatformConfig = PlatformConfig<
  IOSProjectConfig,
  IOSProjectParams,
  IOSDependencyConfig,
  IOSDependencyParams
>;

export type ProjectConfig = {
  android?: Exclude<ReturnType<AndroidPlatformConfig['projectConfig']>, void>;
  ios?: Exclude<ReturnType<IOSPlatformConfig['projectConfig']>, void>;
  [key: string]: any;
};

export interface DependencyConfig {
  name: string;
  root: string;
  platforms: {
    android?: Exclude<
      ReturnType<AndroidPlatformConfig['dependencyConfig']>,
      void
    >;
    ios?: Exclude<ReturnType<IOSPlatformConfig['dependencyConfig']>, void>;
    [key: string]: any;
  };
}

export interface Config {
  root: string;
  reactNativePath: string;
  project: ProjectConfig;
  dependencies: {
    [key: string]: DependencyConfig;
  };
  platforms: {
    android: AndroidPlatformConfig;
    ios: IOSPlatformConfig;
    [name: string]: PlatformConfig<any, any, any, any>;
  };
  commands: Command[];
  // @todo this should be removed: https://github.com/react-native-community/cli/issues/1261
  healthChecks: [];
}

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
  dependency: Omit<DependencyConfig, 'name' | 'root'>;
  // An array of commands that ship with the dependency
  commands: Command[];
  // An array of extra platforms to load
  platforms: Config['platforms'];
  // Additional health checks
  healthChecks: [];
};

export {
  IOSProjectConfig,
  IOSProjectParams,
  IOSDependencyConfig,
  IOSDependencyParams,
  IOSProjectInfo,
};

export {
  AndroidProjectConfig,
  AndroidProjectParams,
  AndroidDependencyConfig,
  AndroidDependencyParams,
};
