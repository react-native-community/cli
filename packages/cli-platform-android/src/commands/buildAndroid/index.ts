import {
  CLIError,
  logger,
  printRunDoctorTip,
} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import execa from 'execa';
import {getAndroidProject} from '../../config/getAndroidProject';
import adb from '../runAndroid/adb';
import getAdbPath from '../runAndroid/getAdbPath';
import {getTaskNames} from '../runAndroid/getTaskNames';
import {promptForTaskSelection} from '../runAndroid/listAndroidTasks';

export interface BuildFlags {
  mode?: string;
  activeArchOnly?: boolean;
  tasks?: Array<string>;
  extraParams?: Array<string>;
  interactive?: boolean;
  dependencyCheck?: boolean;
}

async function buildAndroid(
  _argv: Array<string>,
  config: Config,
  args: BuildFlags,
) {
  const androidProject = getAndroidProject(config);

  if (args.tasks && args.mode) {
    logger.warn(
      'Both "tasks" and "mode" parameters were passed to "build" command. Using "tasks" for building the app.',
    );
  }

  let {tasks} = args;

  if (args.interactive) {
    const selectedTask = await promptForTaskSelection(
      'build',
      androidProject.sourceDir,
    );
    if (selectedTask) {
      tasks = [selectedTask];
    }
  }

  let gradleArgs = getTaskNames(
    androidProject.appName,
    args.mode,
    tasks,
    'bundle',
    androidProject.sourceDir,
  );

  if (args.extraParams) {
    gradleArgs.push(...args.extraParams);
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
      // `reactNativeDebugArchitectures` was renamed to `reactNativeArchitectures` in 0.68.
      // Can be removed when 0.67 no longer needs to be supported.
      gradleArgs.push(
        '-PreactNativeDebugArchitectures=' + architectures.join(','),
      );
      gradleArgs.push('-PreactNativeArchitectures=' + architectures.join(','));
    }
  }

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
    printRunDoctorTip();
    throw new CLIError('Failed to build the app.', error as Error);
  }
}

export const options = [
  {
    name: '--mode <string>',
    description: "Specify your app's build variant",
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
  {
    name: '--interactive',
    description:
      'Explicitly select build type and flavour to use before running a build',
  },
  {
    name: '--dependency-check',
    description:
      'Check if there are any transitive dependencies containing native code that are not declared as a direct dependency in your package.json.',
  },
];

export default {
  name: 'build-android',
  description: 'builds your app',
  func: buildAndroid,
  options,
};
