import {CLIError, logger} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import execa from 'execa';
import {getAndroidProject} from '../../config/getAndroidProject';
import {toPascalCase} from '../runAndroid/runOnAllDevices';

export interface BuildFlags {
  mode: 'debug' | 'release';
  '--variant'?: string;
}
type AndroidProject = NonNullable<Config['project']['android']>;

async function buildAndroid(
  _argv: Array<string>,
  config: Config,
  args: BuildFlags,
) {
  const androidProject = getAndroidProject(config);
  return build(args, androidProject);
}

function build(args: BuildFlags, androidProject: AndroidProject) {
  const variant = args['--variant'] ?? (args.mode || 'debug');
  process.chdir(androidProject.sourceDir);
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';
  const gradleArgs = [`bundle${toPascalCase(variant)}`];
  logger.info('Building the app...');
  logger.debug(`Running command "${cmd} ${gradleArgs.join(' ')}"`);
  try {
    execa.sync(cmd, gradleArgs, {
      stdio: 'inherit',
      cwd: androidProject.sourceDir,
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
  ],
};
