import {CLIError, logger} from '@react-native-community/cli-tools';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import chalk from 'chalk';
import child_process from 'child_process';

export async function getBuildSettings(
  xcodeProject: IOSProjectInfo,
  mode: string,
  buildOutput: string,
  scheme: string,
  target?: string,
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
  const targetSettings = settings[targetIndex].buildSettings;

  const wrapperExtension = targetSettings.WRAPPER_EXTENSION;

  if (wrapperExtension === 'app') {
    return settings[targetIndex].buildSettings;
  }

  return null;
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
