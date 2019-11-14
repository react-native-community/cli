import fs from 'fs';
import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';
import {safeLoad} from 'js-yaml';

const CHECKSUM_KEY = 'SPEC CHECKSUMS';

export default function getDependenciesFromPodfileLock(
  podfileLockPath: string,
) {
  logger.debug(`Reading ${podfileLockPath}`);
  let fileContent;
  try {
    fileContent = fs.readFileSync(podfileLockPath, 'utf8');
  } catch (err) {
    logger.error(
      `Could not find "Podfile.lock" at ${chalk.dim(
        podfileLockPath,
      )}. Did you run "${chalk.bold('pod install')}" in iOS directory?`,
    );
    return [];
  }

  // Previous portions of the lock file could be invalid yaml.
  // Only parse parts that are valid
  const tail = fileContent.split(CHECKSUM_KEY).slice(1);
  const checksumTail = CHECKSUM_KEY + tail;

  return Object.keys(safeLoad(checksumTail)[CHECKSUM_KEY] || {});
}
