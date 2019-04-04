// @flow
import fs from 'fs';
import os from 'os';
import path from 'path';
import {createDirectory} from 'jest-util';
import rimraf from 'rimraf';
import execa from 'execa';
import chalk from 'chalk';
import {Writable} from 'readable-stream';

const CLI_PATH = path.resolve(__dirname, '../packages/cli/build/bin.js');

type RunOptions = {
  nodeOptions?: string,
  nodePath?: string,
  timeout?: number, // kill the process after X milliseconds
  expectedFailure?: boolean,
};

export function run(
  dir: string,
  args?: Array<string>,
  options: RunOptions = {
    expectedFailure: false,
  },
) {
  return spawnCli(dir, args, options);
}

// Runs cli until a given output is achieved, then kills it with `SIGTERM`
export async function runUntil(
  dir: string,
  args: Array<string> | void,
  text: string,
  options: RunOptions = {
    expectedFailure: false,
  },
) {
  const spawnPromise = spawnCliAsync(dir, args, {timeout: 30000, ...options});

  spawnPromise.stderr.pipe(
    new Writable({
      write(chunk, _encoding, callback) {
        const output = chunk.toString('utf8');

        if (output.includes(text)) {
          spawnPromise.kill();
        }

        callback();
      },
    }),
  );

  return spawnPromise;
}

export const makeTemplate = (
  str: string,
): ((values?: Array<any>) => string) => (values?: Array<any>) =>
  str.replace(/\$(\d+)/g, (_match, number) => {
    if (!Array.isArray(values)) {
      throw new Error('Array of values must be passed to the template.');
    }
    return values[number - 1];
  });

export const cleanup = (directory: string) => rimraf.sync(directory);

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
  Object.keys(files).forEach(fileOrPath => {
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
    fs.readdirSync(src).map(filePath =>
      copyDir(path.join(src, filePath), path.join(dest, filePath)),
    );
  } else {
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
};

export const getTempDirectory = (name: string) =>
  path.resolve(os.tmpdir(), name);

function spawnCli(dir: string, args?: Array<string>, options: RunOptions = {}) {
  const {spawnArgs, spawnOptions} = getCliArguments({dir, args, options});

  const result = execa.sync(process.execPath, spawnArgs, spawnOptions);

  handleTestCliFailure(options, result, dir, args);

  return result;
}

function spawnCliAsync(
  dir: string,
  args?: Array<string>,
  options: RunOptions = {},
) {
  const {spawnArgs, spawnOptions} = getCliArguments({dir, args, options});

  try {
    return execa(process.execPath, spawnArgs, spawnOptions);
  } catch (result) {
    handleTestCliFailure(options, result, dir, args);
    return result;
  }
}

function getCliArguments({dir, args, options}) {
  const isRelative = !path.isAbsolute(dir);

  if (isRelative) {
    dir = path.resolve(__dirname, dir);
  }

  const env = Object.assign({}, process.env, {FORCE_COLOR: '0'});

  if (options.nodeOptions) {
    env.NODE_OPTIONS = options.nodeOptions;
  }
  if (options.nodePath) {
    env.NODE_PATH = options.nodePath;
  }

  const spawnArgs = [CLI_PATH, ...(args || [])];
  const spawnOptions = {
    cwd: dir,
    env,
    reject: false,
    timeout: options.timeout || 0,
  };
  return {spawnArgs, spawnOptions};
}

function handleTestCliFailure(options, result, dir, args) {
  if (!options.expectedFailure && result.code !== 0) {
    console.log(`Running CLI failed for unexpected reason. Here's more info:

${chalk.bold('dir:')}    ${dir}
${chalk.bold('args:')}   ${(args || []).join(' ')}
${chalk.bold('stderr:')} ${result.stderr}
${chalk.bold('stdout:')} ${result.stdout}
${chalk.bold('code:')}   ${result.code}`);
  }
}
