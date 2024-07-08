export interface AndroidProjectConfig {
  sourceDir: string;
  appName: string;
  packageName: string;
  applicationId: string;
  mainActivity: string;
  dependencyConfiguration?: string;
  watchModeCommandParams?: string[];
  // @todo remove for RN 0.75
  unstable_reactLegacyComponentNames?: string[] | null;
  assets: string[];
}

export type AndroidProjectParams = {
  sourceDir?: string;
  appName?: string;
  manifestPath?: string;
  packageName?: string;
  dependencyConfiguration?: string;
  watchModeCommandParams?: string[];
  // @todo remove for RN 0.75
  unstable_reactLegacyComponentNames?: string[] | null;
  assets?: string[];
};

export type AndroidDependencyConfig = {
  sourceDir: string;
  packageImportPath: string | null;
  packageInstance: string | null;
  moduleName?: string;
  dependencyConfiguration?: string;
  buildTypes: string[];
  libraryName?: string | null;
  componentDescriptors?: string[] | null;
  cmakeListsPath?: string | null;
  cxxModuleCMakeListsModuleName?: string | null;
  cxxModuleCMakeListsPath?: string | null;
  cxxModuleHeaderName?: string | null;
  isPureCxxDependency?: boolean;
};

export type AndroidDependencyParams = {
  sourceDir?: string;
  manifestPath?: string;
  packageName?: string;
  dependencyConfiguration?: string;
  packageImportPath?: string;
  packageInstance?: string;
  moduleName?: string;
  buildTypes?: string[];
  libraryName?: string | null;
  componentDescriptors?: string[] | null;
  cmakeListsPath?: string | null;
  cxxModuleCMakeListsModuleName?: string | null;
  cxxModuleCMakeListsPath?: string | null;
  cxxModuleHeaderName?: string | null;
};
