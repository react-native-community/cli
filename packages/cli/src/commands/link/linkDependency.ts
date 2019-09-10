import chalk from 'chalk';
import {
  Config,
  AndroidDependencyConfig,
  IOSDependencyConfig,
} from '@react-native-community/cli-types';
import {logger} from '@react-native-community/cli-tools';
import pollParams from './pollParams';
import {getPlatformName} from './getPlatformName';

const linkDependency = async (
  platforms: Config['platforms'],
  project: Config['project'],
  dependency: Config['dependencies']['key'],
): Promise<void | null> => {
  const params = await pollParams(dependency.params);

  Object.keys(platforms || {}).forEach(platform => {
    const projectConfig: AndroidDependencyConfig | IOSDependencyConfig =
      project[platform];
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
