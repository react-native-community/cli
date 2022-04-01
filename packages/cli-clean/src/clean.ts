import {getLoader} from '@react-native-community/cli-tools';
import type {Config as CLIConfig} from '@react-native-community/cli-types';
import {spawn} from 'child_process';
import {existsSync as fileExists, rmdir} from 'fs';
import os from 'os';
import path from 'path';
import {promisify} from 'util';

type Args = {
  include: string;
  projectRoot: string;
  verifyCache?: boolean;
};

type Task = {
  label: string;
  action: () => Promise<void>;
};

type CLICommand = {
  [key: string]: Task[];
};

const DEFAULT_CATEGORIES = ['metro', 'npm', 'watchman', 'yarn'];

const rmdirAsync = promisify(rmdir);

function cleanDir(directory: string): Promise<void> {
  if (!fileExists(directory)) {
    return Promise.resolve();
  }

  return rmdirAsync(directory, {maxRetries: 3, recursive: true});
}

function execute(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      stdio: ['inherit', null, null],
    });

    const stderr: Buffer[] = [];
    process.stderr.on('data', (data) => {
      stderr.push(data);
    });

    process.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
      } else if (stderr) {
        reject(Buffer.concat(stderr).toString().trimEnd());
      } else if (signal) {
        reject(`Failed with signal ${signal}`);
      } else {
        reject(`Failed with exit code ${code}`);
      }
    });
  });
}

function findPath(startPath: string, files: string[]): string | undefined {
  // TODO: Find project files via `@react-native-community/cli`
  for (const file of files) {
    const filename = path.resolve(startPath, file);
    if (fileExists(filename)) {
      return filename;
    }
  }

  return undefined;
}

export async function clean(
  _argv: string[],
  _config: CLIConfig,
  cleanOptions: Args,
): Promise<void> {
  const {include, projectRoot, verifyCache} = cleanOptions;
  if (!fileExists(projectRoot)) {
    throw new Error(`Invalid path provided! ${projectRoot}`);
  }

  const npm = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  const yarn = os.platform() === 'win32' ? 'yarn.cmd' : 'yarn';

  const COMMANDS: CLICommand = {
    android: [
      {
        label: 'Clean Gradle cache',
        action: () => {
          const candidates =
            os.platform() === 'win32'
              ? ['android/gradlew.bat', 'gradlew.bat']
              : ['android/gradlew', 'gradlew'];
          const gradlew = findPath(projectRoot, candidates);
          if (gradlew) {
            const script = path.basename(gradlew);
            return execute(
              os.platform() === 'win32' ? script : `./${script}`,
              ['clean'],
              path.dirname(gradlew),
            );
          } else {
            return Promise.resolve();
          }
        },
      },
    ],
    cocoapods: [
      {
        label: 'Clean CocoaPods cache',
        action: () => execute('pod', ['cache', 'clean', '--all'], projectRoot),
      },
    ],
    metro: [
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
    npm: [
      {
        label: 'Remove node_modules',
        action: () => cleanDir(`${projectRoot}/node_modules`),
      },
      ...(verifyCache
        ? [
            {
              label: 'Verify npm cache',
              action: () => execute(npm, ['cache', 'verify'], projectRoot),
            },
          ]
        : []),
    ],
    watchman: [
      {
        label: 'Stop Watchman',
        action: () =>
          execute(
            os.platform() === 'win32' ? 'tskill' : 'killall',
            ['watchman'],
            projectRoot,
          ),
      },
      {
        label: 'Delete Watchman cache',
        action: () => execute('watchman', ['watch-del-all'], projectRoot),
      },
    ],
    yarn: [
      {
        label: 'Clean Yarn cache',
        action: () => execute(yarn, ['cache', 'clean'], projectRoot),
      },
    ],
  };

  const spinner = getLoader();
  for (const category of include.split(',')) {
    const commands = COMMANDS[category];
    if (!commands) {
      spinner.warn(`Unknown category: ${category}`);
      return;
    }

    for (const {action, label} of commands) {
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
        'Comma-separated flag of caches to clear e.g. `npm,yarn`. When not specified , only non-platform specific caches are cleared. Valid values are android, cocoapods, npm, metro, watchman, yarn.',
      default: DEFAULT_CATEGORIES.join(','),
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
