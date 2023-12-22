import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';

export function getPropertyFromBuildSettings(
  buildSettings: string,
  scheme: string,
  propertyName: string,
  target?: string,
): string | null {
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
    return settings[targetIndex].buildSettings[propertyName];
  }

  return null;
}
