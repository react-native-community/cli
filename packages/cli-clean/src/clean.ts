import {getLoader, logger, prompt} from '@react-native-community/cli-tools';
import type {Config as CLIConfig} from '@react-native-community/cli-types';
import chalk from 'chalk';
import execa from 'execa';
import {existsSync as fileExists, rm} from 'fs';
import os from 'os';
import path from 'path';
import {promisify} from 'util';
import glob from 'fast-glob';

import * as cli from '@react-native/cli';
import type {Task} from '@react-native/cli';

type Args = {
  include?: string;
  projectRoot: string;
  verifyCache?: boolean;
};

type CleanGroups = {
  [key: string]: {
    description: string;
    tasks: Task[];
  };
};

const DEFAULT_GROUPS = ['metro', 'watchman'];

const rmAsync = promisify(rm);
const rmAsyncOptions = {maxRetries: 3, recursive: true, force: true};

function isDirectoryPattern(directory: string): boolean {
  return directory.endsWith('*') || directory.endsWith('?');
}

export async function cleanDir(directory: string): Promise<void> {
  try {
    if (isDirectoryPattern(directory)) {
      const directories = await glob.async(directory, {onlyFiles: false});

      for (const dir of directories) {
        await rmAsync(dir, rmAsyncOptions);
      }
    } else {
      if (!fileExists(directory)) {
        return;
      }
      await rmAsync(directory, rmAsyncOptions);
    }
  } catch (error) {
    logger.error(`An error occurred while cleaning the directory: ${error}`);
  }
}

async function promptForCaches(
  groups: CleanGroups,
): Promise<string[] | undefined> {
  const {caches} = await prompt({
    type: 'multiselect',
    name: 'caches',
    message: 'Select all caches to clean',
    choices: Object.entries(groups).map(([cmd, group]) => ({
      title: `${cmd} ${chalk.dim(`(${group.description})`)}`,
      value: cmd,
      selected: DEFAULT_GROUPS.includes(cmd),
    })),
    min: 1,
  });
  return caches;
}

export async function clean(
  _argv: string[],
  ctx: CLIConfig,
  cleanOptions: Args,
): Promise<void> {
  const {include, projectRoot, verifyCache} = cleanOptions;
  if (!fileExists(projectRoot)) {
    throw new Error(`Invalid path provided! ${projectRoot}`);
  }

  const COMMANDS: CleanGroups = {
    android: {
      description: 'Android build caches, e.g. Gradle',
      tasks: cli.clean.android(ctx.project.android?.sourceDir ?? 'android'),
    },
    metro: {
      description: 'Metro, haste-map caches',
      tasks: cli.clean.metro(),
    },
    npm: {
      description:
        '`node_modules` folder in the current package, and optionally verify npm cache',
      tasks: cli.clean.npm(projectRoot, !!verifyCache),
    },
    bun: {
      description: 'Bun cache',
      tasks: cli.clean.bun(projectRoot),
    },
    watchman: {
      description: 'Stop Watchman and delete its cache',
      tasks: cli.clean.watchman(projectRoot),
    },
    yarn: {
      description: 'Yarn cache',
      tasks: cli.clean.yarn(projectRoot),
    },
  };

  if (cli.clean.cocoapods) {
    COMMANDS.cocoapods = {
      description: 'CocoaPods cache',
      tasks: cli.clean.cocoapods!(projectRoot),
    };
  }

  const groups = include ? include.split(',') : await promptForCaches(COMMANDS);
  if (!groups || groups.length === 0) {
    return;
  }

  const spinner = getLoader();
  for (const group of groups) {
    const commands = COMMANDS[group];
    if (!commands) {
      spinner.warn(`Unknown group: ${group}`);
      continue;
    }

    for (const {action, label} of commands.tasks) {
      spinner.start(label);
      await action()
        .then(() => {
          spinner.succeed();
        })
        .catch((e) => {
          spinner.fail(`${label} » ${e}`);
        });
    }
  }
}

export default {
  func: clean,
  name: 'clean',
  description:
    'Cleans your project by removing React Native related caches and modules.',
  options: [
    {
      name: '--include <string>',
      description:
        'Comma-separated flag of caches to clear e.g. `npm,yarn`. If omitted, an interactive prompt will appear.',
    },
    {
      name: '--project-root <string>',
      description:
        'Root path to your React Native project. When not specified, defaults to current working directory.',
      default: process.cwd(),
    },
    {
      name: '--verify-cache',
      description:
        'Whether to verify the cache. Currently only applies to npm cache.',
      default: false,
    },
  ],
};
