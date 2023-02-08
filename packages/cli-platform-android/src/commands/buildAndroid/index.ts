import {
  CLIError,
  getDefaultUserTerminal,
  isPackagerRunning,
  logger,
} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import execa from 'execa';
import {getAndroidProject} from '../../config/getAndroidProject';
import adb from '../runAndroid/adb';
import getAdbPath from '../runAndroid/getAdbPath';
import {startServerInNewWindow} from './startServerInNewWindow';
import {getTaskNames} from '../runAndroid/getTaskNames';

export interface BuildFlags {
  mode?: string;
  variant?: string;
  activeArchOnly?: boolean;
  packager?: boolean;
  port: number;
  terminal: string;
  tasks?: Array<string>;
  extraParams?: Array<string>;
}

export async function runPackager(args: BuildFlags, config: Config) {
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

  if (args.variant) {
    logger.warn(
      '"variant" flag is deprecated and will be removed in future release. Please switch to "mode" flag.',
    );
  }

  if (args.tasks && args.mode) {
    logger.warn(
      'Both "tasks" and "mode" parameters were passed to "build" command. Using "tasks" for building the app.',
    );
  }

  let gradleArgs = getTaskNames(
    androidProject.appName,
    args.mode || args.variant,
    args.tasks,
    'assemble',
  );

  if (args.extraParams) {
    gradleArgs = [...gradleArgs, ...args.extraParams];
  }

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
  await runPackager(args, config);
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

export const options = [
  {
    name: '--mode <string>',
    description: "Specify your app's build variant",
  },
  {
    name: '--variant <string>',
    description:
      "Specify your app's build variant. Deprecated! Use 'mode' instead",
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
  {
    name: '--extra-params <string>',
    description: 'Custom params passed to gradle build command',
    parse: (val: string) => val.split(' '),
  },
];

export default {
  name: 'build-android',
  description: 'builds your app',
  func: buildAndroid,
  options: options,
};
