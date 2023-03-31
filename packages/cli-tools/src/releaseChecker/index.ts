import path from 'path';
import semver, {SemVer} from 'semver';

import {UnknownProjectError} from '../errors';
import logger from '../logger';
import resolveNodeModuleDir from '../resolveNodeModuleDir';
import getLatestRelease, {Release} from './getLatestRelease';
import printNewRelease from './printNewRelease';

const getReactNativeVersion = (projectRoot: string): string | undefined =>
  require(path.join(
    resolveNodeModuleDir(projectRoot, 'react-native'),
    'package.json',
  ))?.version;

/**
 * Logs out a message if the user's version is behind a stable version of React Native
 */
export async function logIfUpdateAvailable(projectRoot: string): Promise<void> {
  const hasUpdate = await latest(projectRoot);
  if (hasUpdate) {
    printNewRelease(hasUpdate.name, hasUpdate.upgrade, hasUpdate.current);
  }
}

type Update = {
  upgrade: Release;
  current: string;
  name: string;
};

/**
 * Finds the latest stables version of React Native > current version
 */
export async function latest(projectRoot: string): Promise<Update | undefined> {
  try {
    const currentVersion = getReactNativeVersion(projectRoot);
    if (!currentVersion) {
      return;
    }
    const {name} = require(path.join(projectRoot, 'package.json'));
    const latestRelease = await getLatestRelease(name, currentVersion);

    if (latestRelease) {
      return {
        name,
        current: currentVersion,
        upgrade: latestRelease,
      };
    }
  } catch (e) {
    // We let the flow continue as this component is not vital for the rest of
    // the CLI.
    logger.debug(
      'Cannot detect current version of React Native, ' +
        'skipping check for a newer release',
    );
    logger.debug(e as any);
  }
  return undefined;
}

/**
 * Gets the current project's version parsed as Semver
 */
export function current(projectRoot: string): SemVer | undefined {
  try {
    const found = semver.parse(getReactNativeVersion(projectRoot));
    if (found) {
      return found;
    }
  } catch (_) {
    throw new UnknownProjectError(projectRoot);
  }
  return undefined;
}
