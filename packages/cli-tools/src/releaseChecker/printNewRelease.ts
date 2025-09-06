import pico from 'picocolors';

import * as link from '../doclink';

import logger from '../logger';
import type {Release} from './getLatestRelease';
import cacheManager from '../cacheManager';

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
  logger.info(
    `Changelog: ${pico.dim(pico.underline(latestRelease.changelogUrl))}`,
  );
  logger.info(`Diff: ${pico.dim(pico.underline(latestRelease.diffUrl))}`);
  logger.info(
    `For more info, check out "${pico.dim(
      pico.underline(link.docs('upgrading', 'none')),
    )}".`,
  );

  cacheManager.set(name, 'lastChecked', new Date().toISOString());
}
