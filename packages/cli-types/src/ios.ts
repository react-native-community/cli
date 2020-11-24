/**
 * Settings that user can define in the project configuration for iOS.
 * Same for dependency - we share the type.
 *
 * See UserDependencyConfigT and UserConfigT for details
 */
export interface IOSProjectParams {
  project?: string;
  /**
   * @deprecated A podspec should always be at the root of a package and
   *             have the name of the package. This property will be
   *             removed in a future major version.
   *
   * @todo Log a warning when this is used.
   */
  podspecPath?: string;
  sharedLibraries?: string[];
  libraryFolder?: string;
  plist: Array<any>;
  scriptPhases?: Array<any>;
}

export interface IOSDependencyParams extends IOSProjectParams {
  configurations?: string[];
}

// The following types are used in untyped-parts of the codebase, so I am leaving them
// until we actually need them.
export interface IOSProjectConfig {
  sourceDir: string;
  folder: string;
  pbxprojPath: string;
  podfile: string;
  podspecPath: string;
  projectPath: string;
  projectName: string;
  libraryFolder: string;
  sharedLibraries: Array<any>;
  plist: Array<any>;
}

export interface IOSDependencyConfig extends IOSProjectConfig {
  configurations: string[];
}

/**
 * @see https://www.rubydoc.info/gems/cocoapods-core/Pod/Podfile/DSL#script_phase-instance_method
 *
 * The only difference is that `script` may be omitted in favour of a
 * `path`, relative to the root of the package, whose content will be
 * used.
 */
export type IOSScriptPhase = ({script: string} | {path: string}) & {
  name: string;
  shell_path?: string;
  input_files?: string[];
  output_files?: string[];
  input_file_lists?: string[];
  output_file_lists?: string[];
  show_env_vars_in_log?: boolean;
  dependency_file?: string;
  execution_position?: 'before_compile' | 'after_compile' | 'any';
};

/**
 * This describes the data that is expected by `native_modules.rb`. It is only
 * meant to ensure the `Config` interface follows exactly what is needed, so
 * only make changes to this interface (or `IOSScriptPhase`) if the data
 * requirements of `native_modules.rb` change.
 */
export interface IOSNativeModulesConfig {
  reactNativePath: string;
  project: {
    ios?: {
      sourceDir: string;
    };
  };
  dependencies: {
    [name: string]: {
      root: string;
      platforms: {
        ios?: null | {
          /**
           * @deprecated A podspec should always be at the root of a package and
           *             have the name of the package. This property will be
           *             removed in a future major version.
           *
           * @todo Log a warning when this is used.
           */
          podspecPath: string;
          scriptPhases?: Array<IOSScriptPhase>;
        };
        android?: null | {};
      };
    };
  };
}
