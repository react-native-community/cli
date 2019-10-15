/**
 * Settings that user can define in the project configuration for iOS.
 * Same for dependency - we share the type.
 *
 * See UserDependencyConfigT and UserConfigT for details
 */
export interface IOSProjectParams {
  project?: string;
  scriptPhases?: Array<any>;
}

export interface IOSDependencyParams {
  project?: string;
  podspecPath?: string;
  scriptPhases?: Array<any>;
}

export interface IOSProjectConfig {
  sourceDir: string;
  scriptPhases: Array<any>;

  podfile?: string;
}

export interface IOSDependencyConfig {
  sourceDir: string;
  scriptPhases: Array<any>;

  podspecPath?: string;
}
