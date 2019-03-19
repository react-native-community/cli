/**
 * @flow
 */
import path from 'path';
import https from 'https';
import semver from 'semver';
import fs from 'fs';
import logger from '../logger';

type Release = {
  tag_name: string,
  html_url: string,
  draft: boolean,
  prerelease: boolean,
  created_at: string,
  published_at: string,
  body: string,
};

/**
 * Checks via GitHub API if there is a newer stable React Native release and,
 * if it exists, returns the release data.
 *
 * If the latest release is not newer or if it's a prerelease, the function
 * will return null.
 */
export async function getNewerReleaseDataIfAvailable() {
  logger.debug('Checking for a newer version of React Native');
  try {
    const currentVersion = require(getRNPkgJsonPath()).version;
    logger.debug(`Current version: ${currentVersion}`);

    const cache = cacheManager.get();
    let eTag;
    if (cache) {
      eTag = cache.eTag;
      logger.debug(
        `Cached release version: ${semver.coerce(cache.release.tag_name)}`,
      );
    }

    logger.debug('Checking for newer releases on GitHub');
    const response: Response = await getLatestRelease(eTag);

    let latestRelease;
    if (
      response.statusCode === 200 &&
      response.release &&
      !response.release.prerelease
    ) {
      latestRelease = response.release;
      logger.debug(
        `Remote release version: ${semver.coerce(latestRelease.tag_name)}`,
      );
      // Update the cache.
      cacheManager.set({
        release: latestRelease,
        eTag: response.eTag,
      });
    } else {
      // Response status is 304, meaning that our cached release data
      // is the most recent release available.
      logger.debug('Cache is up-to-date with GitHub releases');
      // $FlowFixMe: We know at this point that cache is not null
      latestRelease = cache.release;
    }

    const latestVersion = semver.coerce(latestRelease.tag_name);
    logger.debug(`Latest stable release: ${latestVersion}`);
    if (semver.compare(latestVersion, currentVersion) === 1) {
      return latestRelease;
    } else {
      return null;
    }
  } catch (e) {
    logger.debug(
      'Something went wrong with remote version checking, moving on',
    );
    return null;
  }
}

type Headers = {
  'User-Agent': string,
  [header: string]: string,
};

type Response = {
  eTag: string,
  release: ?Release,
  statusCode: number,
};

function getLatestRelease(eTag: ?string) {
  return new Promise<Response>((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/facebook/react-native/releases/latest',
      // https://developer.github.com/v3/#user-agent-required
      headers: ({'User-Agent': 'React-Native-CLI'}: Headers),
    };

    if (eTag) {
      options.headers['If-None-Match'] = eTag;
    }

    https
      .get(options, result => {
        let body = '';

        result.setEncoding('utf8');
        result.on('data', data => {
          body += data;
        });

        result.on('end', () => {
          resolve({
            // If status code is 304, then body will be empty.
            release: body ? JSON.parse(body) : undefined,
            eTag: result.headers.etag,
            statusCode: result.statusCode,
          });
        });

        result.on('error', error => reject(error));
      })
      .on('error', error => reject(error));
  });
}

const getRNPkgJsonPath = function() {
  return path.resolve(
    process.cwd(),
    'node_modules',
    'react-native',
    'package.json',
  );
};

const cacheManager = {
  get: (): ?{release: Release, eTag: string} => {
    try {
      const cacheRaw = fs.readFileSync(
        path.resolve(__dirname, '.cache'),
        'utf8',
      );
      const cache = JSON.parse(cacheRaw);
      logger.debug(`Found release cache ${cache.eTag}`);
      return cache;
    } catch (e) {
      logger.debug('No release cache found');
      return null;
    }
  },

  set: (releaseData: {release: Release, eTag: string}) => {
    logger.debug(
      `Saving release ${semver.coerce(releaseData.release.tag_name)} as ${
        releaseData.eTag
      } to cache`,
    );
    fs.writeFileSync(
      path.resolve(__dirname, '.cache'),
      JSON.stringify(releaseData),
    );
  },
};
