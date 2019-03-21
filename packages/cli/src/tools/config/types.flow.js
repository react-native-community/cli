/**
 * @flow
 */
export type DependencyConfig = {
  ios: ?DependencyConfigIOS,
  android: ?DependencyConfigAndroid,
};

export type InputDependencyConfigIOS = {
  podspec?: string,
};

export type DependencyConfigIOS = {
  podspec: string,
};

export type InputDependencyConfigAndroid = {
  packageImportPath?: string,
  packageInstance?: string,
};

export type DependencyConfigAndroid = {
  packageImportPath: string,
  packageInstance: string,
  sourceDir: string,
};

export type PlatformConfig<T, K> = {
  getDependencyConfig: (string, T) => ?K,
};

export type Platforms = {
  [key: string]: PlatformConfig<*>,
  ios: PlatformConfig<InputDependencyConfigIOS, DependencyConfigIOS>,
  android: PlatformConfig<
    InputDependencyConfigAndroid,
    DependencyConfigAndroid,
  >,
};

export type ProjectConfig = {
  root: string,
  reactNativePath: string,
  dependencies: {
    [key: string]: DependencyConfig,
  },
};

export type Options = {
  root: ?string,
};
