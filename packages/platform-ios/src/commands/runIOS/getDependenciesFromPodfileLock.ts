import fs from 'fs';
import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';
import {safeLoad} from 'js-yaml';

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
  return Object.keys(safeLoad(fileContent)['SPEC CHECKSUMS'] || {});
}
