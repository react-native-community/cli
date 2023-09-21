import path from 'path';
import fs from 'fs-extra';
import {createHash} from 'crypto';
import chalk from 'chalk';
import {
  CLIError,
  cacheManager,
  getLoader,
} from '@react-native-community/cli-tools';
import installPods from './installPods';
import findPodfilePath from '../config/findPodfilePath';

interface ResolvePodsOptions {
  forceInstall?: boolean;
}

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

export function generateMd5Hash(text: string) {
  return createHash('md5').update(text).digest('hex');
}

export function compareMd5Hashes(hash1: string, hash2: string) {
  return hash1 === hash2;
}

export default async function resolvePods(
  root: string,
  options?: ResolvePodsOptions,
) {
  const packageJson = getPackageJson(root);
  const podfilePath = findPodfilePath(root);
  const iosFolderPath = podfilePath
    ? podfilePath.slice(0, podfilePath.lastIndexOf('/'))
    : path.join(root, 'ios');
  const podsPath = path.join(iosFolderPath, 'Pods');
  const arePodsInstalled = fs.existsSync(podsPath);
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

  if (
    !cachedDependenciesHash ||
    !compareMd5Hashes(currentDependenciesHash, cachedDependenciesHash) ||
    !arePodsInstalled ||
    options?.forceInstall
  ) {
    const loader = getLoader('Installing CocoaPods...');
    try {
      await installPods(loader, {skipBundleInstall: !!cachedDependenciesHash});
      cacheManager.set(
        packageJson.name,
        'dependencies',
        currentDependenciesHash,
      );
      loader.succeed();
    } catch {
      loader.fail();
      throw new CLIError(
        `Something when wrong while installing CocoaPods. Please run ${chalk.bold(
          'pod install',
        )} manually`,
      );
    }
  }
}
