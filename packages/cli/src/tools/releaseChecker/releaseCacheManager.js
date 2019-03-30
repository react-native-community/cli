/**
 * @flow
 */
import path from 'path';
import fs from 'fs';
import logger from '../logger';

type ReleaseCacheKey = 'eTag' | 'lastChecked' | 'latestVersion';

function loadCache(): ?Object {
  try {
    const cacheRaw = fs.readFileSync(path.resolve(__dirname, '.cache'), 'utf8');
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
  fs.writeFileSync(
    path.resolve(__dirname, '.cache'),
    JSON.stringify(cache, null, 2),
  );
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
