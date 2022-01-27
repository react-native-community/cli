export interface AndroidProjectConfig {
  sourceDir: string;
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
};

export type AndroidDependencyParams = {
  sourceDir?: string;
  manifestPath?: string;
  packageName?: string;
  dependencyConfiguration?: string;
  packageImportPath?: string;
  packageInstance?: string;
  buildTypes?: string[];
};
