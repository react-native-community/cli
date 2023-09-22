import {execSync} from 'child_process';
import findUp from 'find-up';
import semver from 'semver';
import logger from './logger';

export function getBunVersionIfAvailable() {
  let bunVersion;

  try {
    bunVersion = (
      execSync('bun --version', {
        stdio: [0, 'pipe', 'ignore'],
      }).toString() || ''
    ).trim();
  } catch (error) {
    return null;
  }

  try {
    if (semver.gte(bunVersion, '1.0.0')) {
      return bunVersion;
    }
    return null;
  } catch (error) {
    logger.error(`Cannot parse bun version: ${bunVersion}`);
    return null;
  }
}

export function isProjectUsingBun(cwd: string) {
  return findUp.sync('bun.lockb', {cwd});
}
