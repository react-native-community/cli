import path from 'path';
import fs from 'fs';
import os from 'os';
import appDirs from 'appdirsjs';
import chalk from 'chalk';
import logger from './logger';

type CacheKey =
  | 'eTag'
  | 'lastChecked'
  | 'latestVersion'
  | 'dependencies'
  | 'podfile'
  | 'podfileLock'
  | 'lastUsedIOSDeviceId';
type Cache = {[key in CacheKey]?: string};

function loadCache(name: string): Cache | undefined {
  try {
    const cacheRaw = fs.readFileSync(
      path.resolve(getCacheRootPath(), name),
      'utf8',
    );
    const cache = JSON.parse(cacheRaw);
    return cache;
  } catch (e) {
    if ((e as any).code === 'ENOENT') {
      // Create cache file since it doesn't exist.
      saveCache(name, {});
    }
    logger.debug('No cache found');
    return undefined;
  }
}

function saveCache(name: string, cache: Cache) {
  const fullPath = path.resolve(getCacheRootPath(), name);

  fs.mkdirSync(path.dirname(fullPath), {recursive: true});
  fs.writeFileSync(fullPath, JSON.stringify(cache, null, 2));
}

/**
 * Returns the path string of `$HOME/.react-native-cli`.
 *
 * In case it doesn't exist, it will be created.
 */
function getCacheRootPath() {
  const legacyPath = path.resolve(os.homedir(), '.react-native-cli', 'cache');
  const cachePath = appDirs({appName: 'react-native-cli', legacyPath}).cache;

  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, {recursive: true});
  }

  return cachePath;
}

function removeProjectCache(name: string) {
  const cacheRootPath = getCacheRootPath();
  try {
    const fullPath = path.resolve(cacheRootPath, name);

    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, {recursive: true});
    }
  } catch {
    logger.error(
      `Failed to remove cache for ${name}. If you experience any issues when running freshly initialized project, please remove the "${chalk.underline(
        path.join(cacheRootPath, name),
      )}" folder manually.`,
    );
  }
}

function get(name: string, key: CacheKey): string | undefined {
  const cache = loadCache(name);
  if (cache) {
    return cache[key];
  }
  return undefined;
}

function set(name: string, key: CacheKey, value: string) {
  const cache = loadCache(name);
  if (cache) {
    cache[key] = value;
    saveCache(name, cache);
  }
}

export default {
  get,
  set,
  removeProjectCache,
  getCacheRootPath,
};
