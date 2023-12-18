import child_process from 'child_process';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {CLIError, logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';

export async function getBuildPath(
  xcodeProject: IOSProjectInfo,
  mode: string,
  buildOutput: string,
  scheme: string,
  target: string | undefined,
  isCatalyst: boolean = false,
) {
  const buildSettings = child_process.execFileSync(
    'xcodebuild',
    [
      xcodeProject.isWorkspace ? '-workspace' : '-project',
      xcodeProject.name,
      '-scheme',
      scheme,
      '-sdk',
      getPlatformName(buildOutput),
      '-configuration',
      mode,
      '-showBuildSettings',
      '-json',
    ],
    {encoding: 'utf8'},
  );

  const {targetBuildDir, executableFolderPath} = await getTargetPaths(
    buildSettings,
    scheme,
    target,
  );

  if (!targetBuildDir) {
    throw new CLIError('Failed to get the target build directory.');
  }

  if (!executableFolderPath) {
    throw new CLIError('Failed to get the app name.');
  }

  return `${targetBuildDir}${
    isCatalyst ? '-maccatalyst' : ''
  }/${executableFolderPath}`;
}

async function getTargetPaths(
  buildSettings: string,
  scheme: string,
  target: string | undefined,
) {
  const settings = JSON.parse(buildSettings);

  const targets = settings.map(
    ({target: settingsTarget}: any) => settingsTarget,
  );

  let selectedTarget = targets[0];

  if (target) {
    if (!targets.includes(target)) {
      logger.info(
        `Target ${chalk.bold(target)} not found for scheme ${chalk.bold(
          scheme,
        )}, automatically selected target ${chalk.bold(selectedTarget)}`,
      );
    } else {
      selectedTarget = target;
    }
  }

  // Find app in all building settings - look for WRAPPER_EXTENSION: 'app',

  const targetIndex = targets.indexOf(selectedTarget);

  const wrapperExtension =
    settings[targetIndex].buildSettings.WRAPPER_EXTENSION;

  if (wrapperExtension === 'app') {
    return {
      targetBuildDir: settings[targetIndex].buildSettings.TARGET_BUILD_DIR,
      executableFolderPath:
        settings[targetIndex].buildSettings.EXECUTABLE_FOLDER_PATH,
    };
  }

  return {};
}

function getPlatformName(buildOutput: string) {
  // Xcode can sometimes escape `=` with a backslash or put the value in quotes
  const platformNameMatch = /export PLATFORM_NAME\\?="?(\w+)"?$/m.exec(
    buildOutput,
  );
  if (!platformNameMatch) {
    throw new CLIError(
      'Couldn\'t find "PLATFORM_NAME" variable in xcodebuild output. Please report this issue and run your project with Xcode instead.',
    );
  }
  return platformNameMatch[1];
}
