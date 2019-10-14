export interface AndroidProjectConfig {
  sourceDir: string;
  packageName: string;
  manifestPath: string;
}

export type AndroidProjectParams = Partial<AndroidProjectConfig>;

export interface AndroidDependencyConfig {
  sourceDir: string;
  packageName: string;
  manifestPath: string;
  packageImportPath: string;
  packageInstance: string;
}

export type AndroidDependencyParams = Partial<AndroidDependencyConfig>;
