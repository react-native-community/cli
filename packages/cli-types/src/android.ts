export interface AndroidProjectConfig {
  sourceDir: string;
  packageName: string;
}

export interface AndroidProjectParams {
  sourceDir?: string;
  manifestPath?: string;
  packageName?: string;
}

export interface AndroidDependencyConfig {
  sourceDir: string;
  packageName: string;

  packageImportPath: string;
  packageInstance: string;
}

export interface AndroidDependencyParams {
  packageName?: string;
  sourceDir?: string;
  manifestPath?: string;

  packageImportPath?: string;
  packageInstance?: string;
}
