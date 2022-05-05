export interface AndroidProjectConfig {
  sourceDir: string;
  appName: string;
  packageName: string;
  dependencyConfiguration?: string;
}

export type AndroidProjectParams = {
  sourceDir?: string;
  appName?: string;
  manifestPath?: string;
  packageName?: string;
  dependencyConfiguration?: string;
};

export type AndroidDependencyConfig = {
  sourceDir: string;
  packageImportPath: string;
  packageInstance: string;
  dependencyConfiguration?: string;
  buildTypes: string[];
  libraryName?: string;
  componentNames?: string[];
  componentDescriptors?: string[];
  androidMkPath?: string;
};

export type AndroidDependencyParams = {
  sourceDir?: string;
  manifestPath?: string;
  packageName?: string;
  dependencyConfiguration?: string;
  packageImportPath?: string;
  packageInstance?: string;
  buildTypes?: string[];
  libraryName?: string;
  componentNames?: string[];
  componentDescriptors?: string[];
  androidMkPath?: string;
};
