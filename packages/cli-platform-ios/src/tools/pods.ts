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
import {
  DependencyConfig,
  IOSDependencyConfig,
} from '@react-native-community/cli-types';

interface ResolvePodsOptions {
  forceInstall?: boolean;
  newArchEnabled?: boolean;
}

interface NativeDependencies {
  [key: string]: DependencyConfig;
}

export function getPackageJson(root: string) {
  try {
    return require(path.join(root, 'package.json'));
  } catch {
    throw new CLIError(
      'No package.json found. Please make sure the file exists in the current folder.',
    );
  }
}

export function getIosDependencies(dependencies: NativeDependencies) {
  return Object.keys(dependencies)
    .filter((dependency) => dependencies[dependency].platforms.ios)
    .map(
      (dependency) =>
        `${dependency}@${
          (dependencies[dependency].platforms.ios as IOSDependencyConfig)
            .version
        }`,
    )
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
  nativeDependencies: NativeDependencies,
  options?: ResolvePodsOptions,
) {
  const packageJson = getPackageJson(root);
  const podfilePath = findPodfilePath(root);
  const iosFolderPath = podfilePath
    ? podfilePath.slice(0, podfilePath.lastIndexOf('/'))
    : path.join(root, 'ios');
  const podsPath = path.join(iosFolderPath, 'Pods');
  const arePodsInstalled = fs.existsSync(podsPath);
  const iosDependencies = getIosDependencies(nativeDependencies);
  const dependenciesString = dependenciesToString(iosDependencies);
  const currentDependenciesHash = generateMd5Hash(dependenciesString);
  const cachedDependenciesHash = cacheManager.get(
    packageJson.name,
    'dependencies',
  );
  const cachedNewArchEnabled = cacheManager.get(
    packageJson.name,
    'newArchEnabled',
  );
  const newArchEnabled = options?.newArchEnabled;

  if (
    !cachedDependenciesHash ||
    !compareMd5Hashes(currentDependenciesHash, cachedDependenciesHash) ||
    !arePodsInstalled ||
    options?.forceInstall ||
    String(newArchEnabled) !== cachedNewArchEnabled
  ) {
    const loader = getLoader('Installing CocoaPods...');
    try {
      await installPods(loader, {
        skipBundleInstall: !!cachedDependenciesHash,
        newArchEnabled: options?.newArchEnabled,
      });
      cacheManager.set(
        packageJson.name,
        'dependencies',
        currentDependenciesHash,
      );

      if (String(newArchEnabled) !== cachedNewArchEnabled) {
        cacheManager.set(
          packageJson.name,
          'newArchEnabled',
          String(newArchEnabled),
        );
      }
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
