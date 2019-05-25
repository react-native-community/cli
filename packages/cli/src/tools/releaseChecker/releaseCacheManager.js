/**
 * @flow
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import logger from '../logger';
import loadConfig from '../config';

type ReleaseCacheKey = 'eTag' | 'lastChecked' | 'latestVersion';

function loadCache(): ?Object {
  try {
    const {name} = require(path.join(loadConfig().root, 'package.json'));
    const cacheRaw = fs.readFileSync(
      path.resolve(getCacheRootPath(), name),
      'utf8',
    );
    const cache = JSON.parse(cacheRaw);
    return cache;
  } catch (e) {
    if (e.code === 'ENOENT') {
      // Create cache file since it doesn't exist.
      saveCache({});
    }
    logger.debug('No release cache found');
  }
}

function saveCache(cache: Object) {
  const {name} = require(path.join(loadConfig().root, 'package.json'));
  fs.writeFileSync(
    path.resolve(getCacheRootPath(), name),
    JSON.stringify(cache, null, 2),
  );
}

/**
 * Returns the path string of `$HOME/.react-native-cli`.
 *
 * In case it doesn't exist, it will be created.
 */
function getCacheRootPath() {
  const cachePath = path.resolve(os.homedir(), '.react-native-cli', 'cache');
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath);
  }

  return cachePath;
}

function get(key: ReleaseCacheKey): any {
  const cache = loadCache();
  if (cache) {
    return cache[key];
  }
}

function set(key: ReleaseCacheKey, value: any) {
  const cache = loadCache();
  if (cache) {
    cache[key] = value;
    saveCache(cache);
  }
}

export default {
  get,
  set,
};
