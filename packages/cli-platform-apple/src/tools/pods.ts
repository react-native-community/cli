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
import {ApplePlatform} from '../types';

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

export function getPlatformDependencies(
  dependencies: NativeDependencies,
  platformName: ApplePlatform,
) {
  return Object.keys(dependencies)
    .filter((dependency) => dependencies[dependency].platforms?.[platformName])
    .map(
      (dependency) =>
        `${dependency}@${
          (
            dependencies[dependency].platforms?.[
              platformName
            ] as IOSDependencyConfig
          ).version
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

async function install(
  packageJson: Record<string, any>,
  cachedDependenciesHash: string | undefined,
  currentDependenciesHash: string,
  iosFolderPath: string,
) {
  const loader = getLoader('Installing CocoaPods...');
  try {
    await installPods(loader, {
      skipBundleInstall: !!cachedDependenciesHash,
      iosFolderPath,
    });
    cacheManager.set(packageJson.name, 'dependencies', currentDependenciesHash);
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

export default async function resolvePods(
  root: string,
  nativeDependencies: NativeDependencies,
  platformName: ApplePlatform,
  options?: ResolvePodsOptions,
) {
  const packageJson = getPackageJson(root);
  const podfilePath = findPodfilePath(root, platformName);
  const platformFolderPath = podfilePath
    ? podfilePath.slice(0, podfilePath.lastIndexOf('/'))
    : path.join(root, platformName);
  const podsPath = path.join(platformFolderPath, 'Pods');
  const arePodsInstalled = fs.existsSync(podsPath);
  const platformDependencies = getPlatformDependencies(
    nativeDependencies,
    platformName,
  );
  const dependenciesString = dependenciesToString(platformDependencies);
  const currentDependenciesHash = generateMd5Hash(dependenciesString);
  const cachedDependenciesHash = cacheManager.get(
    packageJson.name,
    'dependencies',
  );

  if (options?.forceInstall) {
    await install(
      packageJson,
      cachedDependenciesHash,
      currentDependenciesHash,
      platformFolderPath,
    );
  } else if (arePodsInstalled && cachedDependenciesHash === undefined) {
    cacheManager.set(packageJson.name, 'dependencies', currentDependenciesHash);
  } else if (
    !cachedDependenciesHash ||
    !compareMd5Hashes(currentDependenciesHash, cachedDependenciesHash) ||
    !arePodsInstalled
  ) {
    const loader = getLoader('Installing CocoaPods...');
    try {
      await installPods(loader, {
        skipBundleInstall: !!cachedDependenciesHash,
        newArchEnabled: options?.newArchEnabled,
        iosFolderPath: platformFolderPath,
      });
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
