import chalk from 'chalk';

import * as link from '../doclink';

import logger from '../logger';
import {Release} from './getLatestRelease';
import cacheManager from './releaseCacheManager';

/**
 * Notifies the user that a newer version of React Native is available.
 */
export default function printNewRelease(
  name: string,
  latestRelease: Release,
  currentVersion: string,
) {
  logger.info(
    `React Native v${latestRelease.stable} is now available (your project is running on v${currentVersion}).`,
  );
  logger.info(`Changelog: ${chalk.dim.underline(latestRelease.changelogUrl)}`);
  logger.info(`Diff: ${chalk.dim.underline(latestRelease.diffUrl)}`);
  logger.info(
    `For more info, check out "${chalk.dim.underline(
      link.docs('upgrading', 'none'),
    )}".`,
  );

  cacheManager.set(name, 'lastChecked', new Date().toISOString());
}
