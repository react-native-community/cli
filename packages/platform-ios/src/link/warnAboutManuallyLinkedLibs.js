// @flow

import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';
import type {ConfigT} from 'types';
import getLinkConfig from './index';

// TODO: move to cli-tools once platform-ios and platform-android are migrated
// to TS and unify with Android implementation
export default function warnAboutManuallyLinkedLibs(
  config: ConfigT,
  platform?: string = 'ios',
  linkConfig: $Call<typeof getLinkConfig> = getLinkConfig(),
) {
  let deps = [];

  for (let key in config.dependencies) {
    const dependency = config.dependencies[key];
    try {
      const projectConfig = config.project[platform];
      const dependencyConfig = dependency.platforms[platform];
      if (projectConfig && dependencyConfig) {
        const x = linkConfig.isInstalled(
          projectConfig,
          dependency.name,
          dependencyConfig,
        );
        deps = deps.concat(x ? dependency.name : []);
      }
    } catch (error) {
      logger.debug('Checking manually linked modules failed.', error);
    }
  }

  const installedModules = [...new Set(deps)];

  if (installedModules.length) {
    logger.error(
      `React Native CLI uses autolinking for native dependencies, but the following modules are linked manually: \n${installedModules
        .map(
          x =>
            `  - ${chalk.bold(x)} ${chalk.dim(
              `(to unlink run: "react-native unlink ${x}")`,
            )}`,
        )
        .join(
          '\n',
        )}\nThis is likely to happen when upgrading React Native from version lower than 0.60 to 0.60 or later. Please unlink them as they are likely to cause build failures. You can do so with "react-native unlink" command as shown above. If a library is not compatible with autolinking yet, please ignore this warning and notify the library maintainers.`,
    );
  }
}
