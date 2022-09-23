/**
 * Types in this document describe the data that is expected by `native_modules.rb`.
 * When performing changes, make sure to sync it with the Ruby file.
 */

export interface IOSProjectParams {
  sourceDir?: string;
}

export type IOSProjectInfo = {
  name: string;
  isWorkspace: boolean;
};

export interface IOSProjectConfig {
  sourceDir: string;
  xcodeProject: IOSProjectInfo | null;
}

export interface IOSDependencyConfig {
  podspecPath: string;
  scriptPhases: Array<IOSScriptPhase>;
  configurations: string[];
}

export type IOSDependencyParams = Omit<
  Partial<IOSDependencyConfig>,
  'podspecPath'
>;

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
