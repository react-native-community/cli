import {getLoader, logger, prompt} from '@react-native-community/cli-tools';
import type {Config as CLIConfig} from '@react-native-community/cli-types';
import chalk from 'chalk';
import execa from 'execa';
import {existsSync as fileExists, rm} from 'fs';
import os from 'os';
import path from 'path';
import {promisify} from 'util';
import glob from 'tinyglobby';

type Args = {
  include?: string;
  projectRoot: string;
  verifyCache?: boolean;
};

type Task = {
  label: string;
  action: () => Promise<void>;
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
      const directories = await glob.glob(directory, {
        onlyFiles: false,
        expandDirectories: false,
      });

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
      tasks: [
        {
          label: 'Clean Gradle cache',
          action: async () => {
            const gradlew =
              os.platform() === 'win32'
                ? path.join(
                    ctx.project.android?.sourceDir ?? 'android',
                    'gradlew.bat',
                  )
                : path.join(
                    ctx.project.android?.sourceDir ?? 'android',
                    'gradlew',
                  );

            if (fileExists(gradlew)) {
              const script = path.basename(gradlew);
              await execa(
                os.platform() === 'win32' ? script : `./${script}`,
                ['clean'],
                {cwd: path.dirname(gradlew)},
              );
            }
          },
        },
      ],
    },
    ...(os.platform() === 'darwin'
      ? {
          cocoapods: {
            description: 'CocoaPods cache',
            tasks: [
              {
                label: 'Clean CocoaPods pod cache',
                action: async () => {
                  await execa('pod', ['cache', 'clean', '--all'], {
                    cwd: projectRoot,
                  });
                },
              },
              {
                label: 'Remove installed CocoaPods',
                action: () => cleanDir('ios/Pods'),
              },
              {
                label: 'Remove CocoaPods spec cache',
                action: () => cleanDir('~/.cocoapods'),
              },
            ],
          },
        }
      : undefined),
    metro: {
      description: 'Metro, haste-map caches',
      tasks: [
        {
          label: 'Clean Metro cache',
          action: () => cleanDir(`${os.tmpdir()}/metro-*`),
        },
        {
          label: 'Clean Haste cache',
          action: () => cleanDir(`${os.tmpdir()}/haste-map-*`),
        },
        {
          label: 'Clean React Native cache',
          action: () => cleanDir(`${os.tmpdir()}/react-*`),
        },
      ],
    },
    bun: {
      description: 'Bun cache',
      tasks: [
        {
          label: 'Clean Bun cache',
          action: async () => {
            await execa('bun', ['pm', 'cache', 'rm'], {cwd: projectRoot});
          },
        },
      ],
    },
    watchman: {
      description: 'Stop Watchman and delete its cache',
      tasks: [
        {
          label: 'Stop Watchman',
          action: async () => {
            await execa(
              os.platform() === 'win32' ? 'tskill' : 'killall',
              ['watchman'],
              {cwd: projectRoot},
            );
          },
        },
        {
          label: 'Delete Watchman cache',
          action: async () => {
            await execa('watchman', ['watch-del-all'], {cwd: projectRoot});
          },
        },
      ],
    },
    yarn: {
      description: 'Yarn cache',
      tasks: [
        {
          label: 'Clean Yarn cache',
          action: async () => {
            await execa('yarn', ['cache', 'clean'], {cwd: projectRoot});
          },
        },
      ],
    },
    npm: {
      description:
        '`node_modules` folder in the current package, and optionally verify npm cache',
      tasks: [
        {
          label: 'Remove node_modules',
          action: () => cleanDir(`${projectRoot}/node_modules`),
        },
        ...(verifyCache
          ? [
              {
                label: 'Verify npm cache',
                action: async () => {
                  await execa('npm', ['cache', 'verify'], {cwd: projectRoot});
                },
              },
            ]
          : []),
      ],
    },
  };

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
