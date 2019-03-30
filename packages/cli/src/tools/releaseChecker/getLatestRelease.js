/**
 * @flow
 */
import https from 'https';
import semver from 'semver';
import logger from '../logger';
import cacheManager from './releaseCacheManager';

export type Release = {
  version: string,
  changelogUrl: string,
};

/**
 * Checks via GitHub API if there is a newer stable React Native release and,
 * if it exists, returns the release data.
 *
 * If the latest release is not newer or if it's a prerelease, the function
 * will return undefined.
 */
export default (async function(currentVersion: string) {
  logger.debug('Checking for a newer version of React Native');
  try {
    logger.debug(`Current version: ${currentVersion}`);

    const cachedLatest: string = cacheManager.get('latestVersion');

    if (cachedLatest) {
      logger.debug(`Cached release version: ${cachedLatest}`);
    }

    logger.debug('Checking for newer releases on GitHub');
    const eTag = cacheManager.get('eTag');
    const latestVersion = await getLatestRnDiffPurgeVersion(eTag);
    logger.debug(`Latest release: ${latestVersion}`);

    if (
      semver.compare(latestVersion, currentVersion) === 1 &&
      !semver.prerelease(latestVersion)
    ) {
      return {
        version: latestVersion,
        changelogUrl: buildChangelogUrl(latestVersion),
      };
    }
  } catch (e) {
    logger.debug(
      'Something went wrong with remote version checking, moving on',
    );
  }
});

function buildChangelogUrl(version: string) {
  return `https://github.com/facebook/react-native/releases/tag/v${version}`;
}

/**
 * Returns the most recent React Native version available to upgrade to.
 */
async function getLatestRnDiffPurgeVersion(eTag: ?string): Promise<string> {
  const options = {
    hostname: 'api.github.com',
    path: '/repos/react-native-community/rn-diff-purge/tags',
    // https://developer.github.com/v3/#user-agent-required
    headers: ({'User-Agent': 'React-Native-CLI'}: Headers),
  };

  if (eTag) {
    options.headers['If-None-Match'] = eTag;
  }

  const response = await httpsGet(options);

  // Remote is newer.
  if (response.statusCode === 200) {
    const latestVersion = JSON.parse(response.body)[0].name.substring(8);

    // Update cache only if newer release is stable.
    if (!semver.prerelease(latestVersion)) {
      logger.debug(`Saving ${response.eTag} to cache`);
      cacheManager.set('eTag', response.eTag);
      cacheManager.set('latestVersion', latestVersion);
    }

    return latestVersion;
  }

  // Cache is still valid.
  if (response.statusCode === 304) {
    return cacheManager.get('latestVersion');
  }

  // Should be returned only if something went wrong.
  return '0.0.0';
}

type Headers = {
  'User-Agent': string,
  [header: string]: string,
};

function httpsGet(options: any) {
  return new Promise((resolve, reject) => {
    https
      .get(options, result => {
        let body = '';

        result.setEncoding('utf8');
        result.on('data', data => {
          body += data;
        });

        result.on('end', () => {
          resolve({
            body,
            eTag: result.headers.etag,
            statusCode: result.statusCode,
          });
        });

        result.on('error', error => reject(error));
      })
      .on('error', error => reject(error));
  });
}
