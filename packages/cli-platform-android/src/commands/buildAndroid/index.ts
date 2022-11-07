import {
  CLIError,
  getDefaultUserTerminal,
  isPackagerRunning,
  logger,
} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import execa from 'execa';
import {getAndroidProject} from '../../config/getAndroidProject';
import {getTaskNames, toPascalCase} from '../runAndroid/runOnAllDevices';
import adb from '../runAndroid/adb';
import getAdbPath from '../runAndroid/getAdbPath';
import {startServerInNewWindow} from '../runAndroid';

export interface BuildFlags {
  mode: 'debug' | 'release';
  variant?: string;
  activeArchOnly?: boolean;
  packager: boolean;
  port: number;
  terminal: string;
  tasks?: Array<string>;
}

export async function checkPackager(args: BuildFlags, config: Config) {
  if (!args.packager) {
    return;
  }
  const result = await isPackagerRunning(args.port);
  if (result === 'running') {
    logger.info('JS server already running.');
  } else if (result === 'unrecognized') {
    logger.warn('JS server not recognized, continuing with build...');
  } else {
    // result == 'not_running'
    logger.info('Starting JS server...');
    try {
      startServerInNewWindow(args.port, args.terminal, config.reactNativePath);
    } catch (error) {
      logger.warn(
        `Failed to automatically start the packager server. Please run "react-native start" manually. Error details: ${error.message}`,
      );
    }
  }
}

async function buildAndroid(
  _argv: Array<string>,
  config: Config,
  args: BuildFlags,
) {
  const androidProject = getAndroidProject(config);
  const variant = args.variant ?? (args.mode || 'debug');
  const tasks = args.tasks || ['assemble' + toPascalCase(variant)];
  const gradleArgs = getTaskNames(androidProject.appName, tasks);

  if (args.activeArchOnly) {
    const adbPath = getAdbPath();
    const devices = adb.getDevices(adbPath);
    const architectures = devices
      .map((device) => {
        return adb.getCPU(adbPath, device);
      })
      .filter(
        (arch, index, array) => arch != null && array.indexOf(arch) === index,
      );
    if (architectures.length > 0) {
      logger.info(`Detected architectures ${architectures.join(', ')}`);
      // `reactNativeDebugArchitectures` was renamed to `reactNativeArchitectures` in 0.68.
      // Can be removed when 0.67 no longer needs to be supported.
      gradleArgs.push(
        '-PreactNativeDebugArchitectures=' + architectures.join(','),
      );
      gradleArgs.push('-PreactNativeArchitectures=' + architectures.join(','));
    }
  }
  await checkPackager(args, config);
  return build(gradleArgs, androidProject.sourceDir);
}

export function build(gradleArgs: string[], sourceDir: string) {
  process.chdir(sourceDir);
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';
  logger.info('Building the app...');
  logger.debug(`Running command "${cmd} ${gradleArgs.join(' ')}"`);
  try {
    execa.sync(cmd, gradleArgs, {
      stdio: 'inherit',
      cwd: sourceDir,
    });
  } catch (error) {
    throw new CLIError('Failed to build the app.', error);
  }
}

export default {
  name: 'build-android',
  description: 'builds your app',
  func: buildAndroid,
  options: [
    {
      name: '--mode <release|debug>',
      description: "Specify your app's build variant",
      default: 'debug',
    },
    {
      name: '--variant <string>',
      description: 'Override mode with your custom configuration',
    },
    {
      name: '--no-packager',
      description: 'Do not launch packager while building',
    },
    {
      name: '--port <number>',
      default: process.env.RCT_METRO_PORT || 8081,
      parse: Number,
    },
    {
      name: '--terminal <string>',
      description:
        'Launches the Metro Bundler in a new window using the specified terminal path.',
      default: getDefaultUserTerminal(),
    },
    {
      name: '--tasks <list>',
      description:
        'Run custom Gradle tasks. By default it\'s "assembleDebug". Will override passed mode and variant arguments.',
      parse: (val: string) => val.split(','),
    },
    {
      name: '--active-arch-only',
      description:
        'Build native libraries only for the current device architecture for debug builds.',
      default: false,
    },
  ],
};
