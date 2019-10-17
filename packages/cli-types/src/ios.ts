/**
 * Settings that user can define in the project configuration for iOS.
 * Same for dependency - we share the type.
 *
 * See UserDependencyConfigT and UserConfigT for details
 */
type ScriptPhase = {
  name: string;
  path: string;
  execution_position: string;
};

export interface IOSProjectParams {
  project?: string;
  scriptPhases?: Array<ScriptPhase>;
}

export interface IOSDependencyParams {
  project?: string;
  podspecPath?: string;
  scriptPhases?: Array<ScriptPhase>;
}

export interface IOSProjectConfig {
  sourceDir: string;
  scriptPhases: Array<ScriptPhase>;

  podfile: string | null;
}

export interface IOSDependencyConfig {
  sourceDir: string;
  scriptPhases: Array<{
    name: string;
    path: string;
    execution_position: string;
  }>;
  podspecPath: string | null;
}
