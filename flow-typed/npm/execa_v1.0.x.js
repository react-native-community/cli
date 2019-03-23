// flow-typed signature: 613ee1ec7d728b6a312fcff21a7b2669
// flow-typed version: 3163f7a6e3/execa_v1.0.x/flow_>=v0.75.x

declare module 'execa' {

  declare type StdIoOption =
    | 'pipe'
    | 'ipc'
    | 'ignore'
    | 'inherit'
    | stream$Stream
    | number;

  declare type CommonOptions = {|
    argv0?: string,
    cleanup?: boolean,
    cwd?: string,
    detached?: boolean,
    encoding?: string,
    env?: {[string]: string},
    extendEnv?: boolean,
    gid?: number,
    killSignal?: string | number,
    localDir?: string,
    maxBuffer?: number,
    preferLocal?: boolean,
    reject?: boolean,
    shell?: boolean | string,
    stderr?: ?StdIoOption,
    stdin?: ?StdIoOption,
    stdio?: 'pipe' | 'ignore' | 'inherit' | $ReadOnlyArray<?StdIoOption>,
    stdout?: ?StdIoOption,
    stripEof?: boolean,
    timeout?: number,
    uid?: number,
    windowsVerbatimArguments?: boolean,
  |};

  declare type SyncOptions = {|
    ...CommonOptions,
    input?: string | Buffer,
  |};

  declare type Options = {|
    ...CommonOptions,
    input?: string | Buffer | stream$Readable,
  |};

  declare type SyncResult = {|
    stdout: string,
    stderr: string,
    code: number,
    failed: boolean,
    signal: ?string,
    cmd: string,
    timedOut: boolean,
  |};

  declare type Result = {|
    ...SyncResult,
    killed: boolean,
  |};

  declare interface ThenableChildProcess extends child_process$ChildProcess {
    then<R, E>(
      onfulfilled?: ?((value: Result) => R | Promise<R>),
      onrejected?: ?((reason: ExecaError) => E | Promise<E>),
    ): Promise<R | E>;

    catch<E>(
      onrejected?: ?((reason: ExecaError) => E | Promise<E>)
    ): Promise<Result | E>;
  }

  declare interface ExecaError extends ErrnoError {
    stdout: string;
    stderr: string;
    failed: boolean;
    signal: ?string;
    cmd: string;
    timedOut: boolean;
  }

  declare interface Execa {
    (file: string, args?: $ReadOnlyArray<string>, options?: $ReadOnly<Options>): ThenableChildProcess;
    (file: string, options?: $ReadOnly<Options>): ThenableChildProcess;

    stdout(file: string, args?: $ReadOnlyArray<string>, options?: $ReadOnly<Options>): Promise<string>;
    stdout(file: string, options?: $ReadOnly<Options>): Promise<string>;

    stderr(file: string, args?: $ReadOnlyArray<string>, options?: $ReadOnly<Options>): Promise<string>;
    stderr(file: string, options?: $ReadOnly<Options>): Promise<string>;

    shell(command: string, options?: $ReadOnly<Options>): ThenableChildProcess;

    sync(file: string, args?: $ReadOnlyArray<string>, options?: $ReadOnly<SyncOptions>): SyncResult;
    sync(file: string, options?: $ReadOnly<SyncOptions>): SyncResult;

    shellSync(command: string, options?: $ReadOnly<Options>): SyncResult;
  }

  declare module.exports: Execa;
}
