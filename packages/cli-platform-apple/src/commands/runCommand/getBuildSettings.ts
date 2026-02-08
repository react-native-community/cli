import {CLIError, logger} from '@react-native-community/cli-tools';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import pico from 'picocolors';
import child_process from 'child_process';

export type BuildSettings = {
  TARGET_BUILD_DIR: string;
  INFOPLIST_PATH: string;
  EXECUTABLE_FOLDER_PATH: string;
  FULL_PRODUCT_NAME: string;
};

export async function getBuildSettings(
  xcodeProject: IOSProjectInfo,
  mode: string,
  buildOutput: string,
  scheme: string,
  target?: string,
): Promise<BuildSettings | null> {
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

  // Find all 'app' targets in the build settings
  const applicationTargets = settings
    .filter((setting: any) => setting.buildSettings.WRAPPER_EXTENSION === 'app')
    .map(({target: settingsTarget}: any) => settingsTarget);

  if (applicationTargets.length === 0) {
    return null;
  }

  let selectedTarget = applicationTargets[0];

  if (target) {
    if (!applicationTargets.includes(target)) {
      logger.info(
        `Target ${pico.bold(target)} not found for scheme ${pico.bold(
          scheme,
        )}, automatically selected target ${pico.bold(selectedTarget)}`,
      );
    } else {
      selectedTarget = target;
    }
  }

  const targetIndex = applicationTargets.indexOf(selectedTarget);
  return settings[targetIndex].buildSettings;
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
