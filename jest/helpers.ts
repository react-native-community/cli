import fs from 'fs';
import os from 'os';
import path from 'path';
import {createDirectory} from 'jest-util';
import execa from 'execa';
import chalk from 'chalk';
import slash from 'slash';

const CLI_PATH = path.resolve(__dirname, '../packages/cli/build/bin.js');

type RunOptions = {
  nodeOptions?: string;
  nodePath?: string;
  timeout?: number; // kill the process after X milliseconds
  expectedFailure?: boolean;
};

/**
 * Helper function to run CLI command in a given folder
 */
export function runCLI(
  dir: string,
  args?: string[],
  options: RunOptions = {
    expectedFailure: false,
  },
) {
  return spawnScript(process.execPath, [CLI_PATH, ...(args || [])], {
    ...options,
    cwd: dir,
    env: {
      YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
    },
  });
}

export const makeTemplate =
  (str: string): ((values?: Array<any>) => string) =>
  (values?: Array<any>) =>
    str.replace(/\$(\d+)/g, (_match, number) => {
      if (!Array.isArray(values)) {
        throw new Error('Array of values must be passed to the template.');
      }
      return values[number - 1];
    });

export const cleanup = (directory: string) => {
  fs.rmSync(directory, {recursive: true, force: true});
};

/**
 * Creates a nested directory with files and their contents
 * writeFiles(
 *   '/home/tmp',
 *   {
 *     'package.json': '{}',
 *     'dir/file.js': 'module.exports = "x";',
 *   }
 * );
 */
export const writeFiles = (
  directory: string,
  files: {[filename: string]: string},
) => {
  createDirectory(directory);
  Object.keys(files).forEach((fileOrPath) => {
    const dirname = path.dirname(fileOrPath);

    if (dirname !== '/') {
      createDirectory(path.join(directory, dirname));
    }
    fs.writeFileSync(
      path.resolve(directory, ...fileOrPath.split('/')),
      files[fileOrPath],
    );
  });
};

export const copyDir = (src: string, dest: string) => {
  const srcStat = fs.lstatSync(src);
  if (srcStat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).map((filePath) =>
      copyDir(path.join(src, filePath), path.join(dest, filePath)),
    );
  } else {
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
};

export const getTempDirectory = (name: string) =>
  path.resolve(os.tmpdir(), name);

type SpawnOptions = RunOptions & {
  cwd: string;
  env?: {[key: string]: string | undefined};
};

type SpawnFunction<T> = (
  execPath: string,
  args: string[],
  options: SpawnOptions,
) => T;

export const spawnScript: SpawnFunction<execa.ExecaReturnBase<string>> = (
  execPath,
  args,
  options,
) => {
  const result = execa.sync(execPath, args, getExecaOptions(options));

  handleTestFailure(execPath, options, result, args);

  return result;
};

function getExecaOptions(options: SpawnOptions) {
  const isRelative = !path.isAbsolute(options.cwd);

  const cwd = isRelative ? path.resolve(__dirname, options.cwd) : options.cwd;

  let env = Object.assign({}, process.env, {FORCE_COLOR: '0'}, options.env);

  if (options.nodeOptions) {
    env.NODE_OPTIONS = options.nodeOptions;
  }

  if (options.nodePath) {
    env.NODE_PATH = options.nodePath;
  }

  return {
    cwd,
    env,
    reject: false,
    timeout: options.timeout || 0,
  };
}

function handleTestFailure(
  cmd: string,
  options: SpawnOptions,
  result: {[key: string]: any},
  args: string[] | undefined,
) {
  if (!options.expectedFailure && result.code !== 0) {
    console.log(`Running ${cmd} command failed for unexpected reason. Here's more info:
${chalk.bold('cmd:')}     ${cmd}
${chalk.bold('options:')} ${JSON.stringify(options)}
${chalk.bold('args:')}    ${(args || []).join(' ')}
${chalk.bold('stderr:')}  ${result.stderr}
${chalk.bold('stdout:')}  ${result.stdout}
${chalk.bold('code:')}    ${result.code}`);
  } else if (options.expectedFailure && result.code === 0) {
    throw new Error("Expected command to fail, but it didn't");
  }
}

export function replaceProjectRootInOutput(output: string, testFolder: string) {
  const regex = new RegExp(`(:\\s").*(${slash(testFolder)})`, 'g');
  return slash(output).replace(regex, '$1<<REPLACED_ROOT>>');
}

export function getAllPackages() {
  return fs.readdirSync(path.resolve(__dirname, '../packages'));
}

export function addRNCPrefix(packages: string[]) {
  return packages.map((p) => `@react-native-community/${p}`);
}
