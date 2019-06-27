// @flow
import chalk from 'chalk';
import type {DependencyConfigT, ProjectConfigT, PlatformsT} from 'types';
import {logger} from '@react-native-community/cli-tools';
import pollParams from './pollParams';
import getPlatformName from './getPlatformName';

const linkDependency = async (
  platforms: PlatformsT,
  project: ProjectConfigT,
  dependency: DependencyConfigT,
  dryRun?: boolean = false,
) => {
  const params = await pollParams(dependency.params);
  return Object.keys(platforms || {}).map<any>(platform => {
    const projectConfig = project[platform];
    const dependencyConfig = dependency.platforms[platform];

    if (!projectConfig || !dependencyConfig) {
      return;
    }
    const {name} = dependency;
    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();

    if (!linkConfig || !linkConfig.isInstalled || !linkConfig.register) {
      return;
    }

    const isInstalled = linkConfig.isInstalled(
      // $FlowFixMe
      projectConfig,
      name,
      // $FlowFixMe
      dependencyConfig,
    );

    if (dryRun) {
      return {dependency, platform, isInstalled};
    }

    if (isInstalled) {
      logger.info(
        `${getPlatformName(platform)} module "${chalk.bold(
          name,
        )}" is already linked`,
      );
      return;
    }

    logger.info(
      `Linking "${chalk.bold(name)}" ${getPlatformName(platform)} dependency`,
    );
    // $FlowFixMe
    linkConfig.register(name, dependencyConfig, params, projectConfig);

    logger.info(
      `${getPlatformName(platform)} module "${chalk.bold(
        dependency.name,
      )}" has been successfully linked`,
    );
  });
};

export default linkDependency;
