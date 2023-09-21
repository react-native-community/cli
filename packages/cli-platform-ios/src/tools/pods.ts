import path from 'path';
import md5 from 'crypto-js/md5';
import {cacheManager, getLoader} from '@react-native-community/cli-tools';
import installPods from './installPods';

export function getPackageJson(root: string) {
  return require(path.join(root, 'package.json'));
}

export function normalizeDependencies(dependencies: Record<string, string>) {
  return Object.entries(dependencies)
    .map(([name, version]) => `${name}@${version}`)
    .sort();
}

export function dependenciesToString(dependencies: string[]) {
  return dependencies.join('\n');
}

function generateMd5Hash(text: string) {
  return md5(text).toString();
}

function compareMd5Hashes(hash1: string, hash2: string) {
  return hash1 === hash2;
}

export default async function resolvePods(root: string) {
  const packageJson = getPackageJson(root);
  const dependencies = normalizeDependencies({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  });
  const dependenciesString = dependenciesToString(dependencies);
  const currentDependenciesHash = generateMd5Hash(dependenciesString);
  const cachedDependenciesHash = cacheManager.get(
    packageJson.name,
    'dependencies',
  );

  if (!cachedDependenciesHash) {
    cacheManager.set(packageJson.name, 'dependencies', currentDependenciesHash);
  }

  if (
    !cachedDependenciesHash ||
    !compareMd5Hashes(currentDependenciesHash, cachedDependenciesHash)
  ) {
    const loader = getLoader('Installing CocoaPods...');
    await installPods(loader);
  }
}
