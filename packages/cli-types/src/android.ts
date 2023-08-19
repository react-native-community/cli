export interface AndroidProjectConfig {
  sourceDir: string;
  appName: string;
  packageName: string;
  applicationId: string;
  mainActivity: string;
  dependencyConfiguration?: string;
  watchModeCommandParams?: string[];
  unstable_reactLegacyComponentNames?: string[] | null;
}

export type AndroidProjectParams = {
  sourceDir?: string;
  appName?: string;
  manifestPath?: string;
  packageName?: string;
  dependencyConfiguration?: string;
  watchModeCommandParams?: string[];
  unstable_reactLegacyComponentNames?: string[] | null;
};

export type AndroidDependencyConfig = {
  sourceDir: string;
  packageImportPath: string;
  packageInstance: string;
  dependencyConfiguration?: string;
  buildTypes: string[];
  libraryName?: string | null;
  componentDescriptors?: string[] | null;
  cmakeListsPath?: string | null;
};

export type AndroidDependencyParams = {
  sourceDir?: string;
  manifestPath?: string;
  packageName?: string;
  dependencyConfiguration?: string;
  packageImportPath?: string;
  packageInstance?: string;
  buildTypes?: string[];
  libraryName?: string | null;
  componentDescriptors?: string[] | null;
  cmakeListsPath?: string | null;
};
