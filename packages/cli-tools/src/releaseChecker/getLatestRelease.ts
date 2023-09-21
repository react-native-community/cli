import semver from 'semver';
import cacheManager from '../cacheManager';
import {fetch} from '../fetch';
import logger from '../logger';

export type Release = {
  // The current stable release
  stable: string;
  // The current candidate release. These are only populated if the latest release is a candidate release.
  candidate?: string;
  changelogUrl: string;
  diffUrl: string;
};

interface DiffPurge {
  name: string;
  zipball_url: string;
  tarball_url: string;
  commit: {
    sha: string;
    url: string;
  };
  node_id: string;
}

function isDiffPurgeEntry(data: any): data is DiffPurge {
  return (
    [
      data.name,
      data.zipball_url,
      data.tarball_url,
      data.commit?.sha,
      data.commit?.url,
      data.node_id,
    ].indexOf(false) === -1
  );
}

/**
 * Checks via GitHub API if there is a newer stable React Native release and,
 * if it exists, returns the release data.
 *
 * If the latest release is not newer or if it's a prerelease, the function
 * will return undefined.
 */
export default async function getLatestRelease(
  name: string,
  currentVersion: string,
): Promise<Release | undefined> {
  logger.debug('Checking for a newer version of React Native');
  try {
    logger.debug(`Current version: ${currentVersion}`);

    // if the version is a 1000.0.0 version or 0.0.0, we want to bail
    // since they are nightlies or unreleased versions
    if (
      currentVersion.includes('1000.0.0') ||
      currentVersion.includes('0.0.0')
    ) {
      return;
    }

    const cachedLatest = cacheManager.get(name, 'latestVersion');

    if (cachedLatest) {
      logger.debug(`Cached release version: ${cachedLatest}`);
    }

    logger.debug('Checking for newer releases on GitHub');
    const eTag = cacheManager.get(name, 'eTag');
    const {stable, candidate} = await getLatestRnDiffPurgeVersion(name, eTag);
    logger.debug(`Latest release: ${stable} (${candidate})`);

    if (semver.compare(stable, currentVersion) >= 0) {
      return {
        stable,
        candidate,
        changelogUrl: buildChangelogUrl(stable),
        diffUrl: buildDiffUrl(stable),
      };
    }
  } catch (e) {
    logger.debug(
      'Something went wrong with remote version checking, moving on',
    );
    logger.debug(e as any);
  }
  return undefined;
}

function buildChangelogUrl(version: string) {
  return `https://github.com/facebook/react-native/releases/tag/v${version}`;
}

function buildDiffUrl(version: string) {
  return `https://react-native-community.github.io/upgrade-helper/?from=${version}`;
}

type LatestVersions = {
  candidate?: string;
  stable: string;
};

/**
 * Returns the most recent React Native version available to upgrade to.
 */
async function getLatestRnDiffPurgeVersion(
  name: string,
  eTag?: string,
): Promise<LatestVersions> {
  const options = {
    // https://developer.github.com/v3/#user-agent-required
    headers: {'User-Agent': 'React-Native-CLI'} as Headers,
  };

  if (eTag) {
    options.headers['If-None-Match'] = eTag;
  }

  const {data, status, headers} = await fetch(
    'https://api.github.com/repos/react-native-community/rn-diff-purge/tags',
    options,
  );

  const result: LatestVersions = {stable: '0.0.0'};

  // Remote is newer.
  if (status === 200) {
    const body: DiffPurge[] = data.filter(isDiffPurgeEntry);
    const eTagHeader = headers.get('eTag');

    for (let {name: version} of body) {
      if (!result.candidate && version.includes('-rc')) {
        result.candidate = version.substring(8);
        continue;
      }
      if (!version.includes('-rc')) {
        result.stable = version.substring(8);
        if (eTagHeader) {
          logger.debug(`Saving ${eTagHeader} to cache`);
          cacheManager.set(name, 'eTag', eTagHeader);
          cacheManager.set(name, 'latestVersion', result.stable);
        }
        return result;
      }
    }
    return result;
  }

  // Cache is still valid.
  if (status === 304) {
    result.stable = cacheManager.get(name, 'latestVersion') ?? result.stable;
  }

  // Should be returned only if something went wrong.
  return result;
}

type Headers = {
  'User-Agent': string;
  [header: string]: string;
};
