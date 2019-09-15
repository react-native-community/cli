import {isEmpty} from 'lodash';
import {Config} from '@react-native-community/cli-types';
import {logger} from '@react-native-community/cli-tools';

export default function linkAssets(
  platforms: Config['platforms'],
  project: Config['project'],
  assets: Array<string>,
) {
  if (isEmpty(assets)) {
    return;
  }

  Object.keys(platforms || {}).forEach(platform => {
    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();

    if (!linkConfig || !linkConfig.copyAssets || !project[platform]) {
      return;
    }

    logger.info(`Linking assets to ${platform} project`);

    linkConfig.copyAssets(assets, project[platform]);
  });

  logger.success('Assets have been successfully linked to your project');
}
