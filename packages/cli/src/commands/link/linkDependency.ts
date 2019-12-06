import chalk from 'chalk';
import {
  Config,
  Dependency,
  AndroidDependencyConfig,
  AndroidProjectConfig,
  IOSDependencyConfig,
  IOSProjectConfig,
} from '@react-native-community/cli-types';
import {logger} from '@react-native-community/cli-tools';
import pollParams from './pollParams';
import getPlatformName from './getPlatformName';

export default async function linkDependency(
  platforms: Config['platforms'],
  project: Config['project'],
  dependency: Dependency,
) {
  const params = await pollParams(dependency.params);

  Object.keys(platforms || {}).forEach(platform => {
    const projectConfig: AndroidProjectConfig | IOSProjectConfig =
      project[platform];
    const dependencyConfig: AndroidDependencyConfig | IOSDependencyConfig =
      dependency.platforms[platform];

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
      projectConfig,
      name,
      dependencyConfig,
    );

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

    linkConfig.register(name, dependencyConfig, params, projectConfig);

    logger.info(
      `${getPlatformName(platform)} module "${chalk.bold(
        dependency.name,
      )}" has been successfully linked`,
    );
  });
}
