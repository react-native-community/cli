import fs from 'fs';
import os from 'os';
import path from 'path';
import {createDirectory} from 'jest-util';
import {spawnSync} from 'child_process';
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
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, {recursive: true, force: true, maxRetries: 10});
  }
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
  files: {[filename: string]: string | NodeJS.ArrayBufferView},
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

export const spawnScript: SpawnFunction<any> = (execPath, args, options) => {
  // Use Node.js built-in spawnSync instead of execa to avoid ESM import issues in Jest
  const execaOptions = getExecaOptions(options);
  const result = spawnSync(execPath, args, {
    ...execaOptions,
    encoding: 'utf8',
  });

  // Transform spawnSync result to match execa format
  const execaLikeResult = {
    exitCode: result.status || 0,
    stdout: result.stdout?.trim() || '',
    stderr: result.stderr?.trim() || '',
    failed: result.status !== 0,
  };

  handleTestFailure(execPath, options, execaLikeResult, args);

  return execaLikeResult;
};

function getExecaOptions(options: SpawnOptions) {
  const isRelative = !path.isAbsolute(options.cwd);

  const cwd = isRelative ? path.resolve(__dirname, options.cwd) : options.cwd;

  const localBin = path.resolve(cwd, 'node_modules/.bin');

  // Merge the existing environment with the new one
  let env = Object.assign({}, process.env, {FORCE_COLOR: '0'}, options.env);

  // Prepend the local node_modules/.bin to the PATH
  env.PATH = `${localBin}${path.delimiter}${env.PATH}`;

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
  result: any,
  args: string[] | undefined,
) {
  if (!options.expectedFailure && result.exitCode !== 0) {
    console.log(`Running ${cmd} command failed for unexpected reason. Here's more info:
${chalk.bold('cmd:')}     ${cmd}
${chalk.bold('options:')} ${JSON.stringify(options)}
${chalk.bold('args:')}    ${(args || []).join(' ')}
${chalk.bold('stderr:')}  ${result.stderr}
${chalk.bold('stdout:')}  ${result.stdout}
${chalk.bold('exitCode:')}${result.exitCode}`);
  } else if (options.expectedFailure && result.exitCode === 0) {
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
