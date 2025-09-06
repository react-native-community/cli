import path from 'path';
import fs from 'fs-extra';
import {createHash} from 'crypto';
import pico from 'picocolors';
import {
  CLIError,
  cacheManager,
  getLoader,
} from '@react-native-community/cli-tools';
import installPods from './installPods';
import {
  DependencyConfig,
  IOSDependencyConfig,
} from '@react-native-community/cli-types';
import {ApplePlatform} from '../types';
import runCodegen from './runCodegen';
import execa from 'execa';

interface ResolvePodsOptions {
  forceInstall?: boolean;
  newArchEnabled?: boolean;
}

interface NativeDependencies {
  [key: string]: DependencyConfig;
}

function getPackageJson(root: string) {
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

export function compareMd5Hashes(hash1?: string, hash2?: string) {
  return hash1 === hash2;
}

async function getChecksum(
  podfileLockPath: string,
): Promise<string | undefined> {
  try {
    const file = fs.readFileSync(podfileLockPath, 'utf8');

    const checksumLine = file
      .split('\n')
      .find((line) => line.includes('PODFILE CHECKSUM'));

    if (checksumLine) {
      return checksumLine.split(': ')[1];
    }

    return undefined;
  } catch {
    return undefined;
  }
}

async function install(
  packageJson: Record<string, any>,
  cachedDependenciesHash: string | undefined,
  currentDependenciesHash: string,
  iosFolderPath: string,
  platform: string,
  root: string,
  reactNativePath: string,
) {
  const loader = getLoader('Installing CocoaPods...');
  try {
    await runCodegen({
      root,
      platform,
      reactNativePath,
      iosFolderPath,
    });
    await installPods(loader, {
      skipBundleInstall: !!cachedDependenciesHash,
      iosFolderPath,
    });
    cacheManager.set(packageJson.name, 'dependencies', currentDependenciesHash);
    loader.succeed();
  } catch (error) {
    loader.fail();
    throw new CLIError(
      `Something went wrong while installing CocoaPods. Please run ${pico.bold(
        'pod install',
      )} manually`,
      error as Error,
    );
  }
}

export default async function resolvePods(
  root: string,
  sourceDir: string,
  nativeDependencies: NativeDependencies,
  platformName: ApplePlatform,
  reactNativePath: string,
  options?: ResolvePodsOptions,
) {
  const packageJson = getPackageJson(root);
  const podfilePath = path.join(sourceDir, 'Podfile'); // sourceDir is calculated based on Podfile location, see getProjectConfig()

  const podfileLockPath = path.join(sourceDir, 'Podfile.lock');
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
  // Users can manually add dependencies to Podfile, so we can't entirely rely on `dependencies` from `config`'s output.
  const currentPodfileHash = generateMd5Hash(
    fs.readFileSync(podfilePath, 'utf8'),
  );
  let currentPodfileLockChecksum = await getChecksum(podfileLockPath);

  const cachedPodfileHash = cacheManager.get(packageJson.name, 'podfile');
  const cachedPodfileLockChecksum = cacheManager.get(
    packageJson.name,
    'podfileLock',
  );

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
      platformName,
      root,
      reactNativePath,
    );
  } else if (
    arePodsInstalled &&
    compareMd5Hashes(currentDependenciesHash, cachedDependenciesHash) &&
    compareMd5Hashes(currentPodfileHash, cachedPodfileHash) &&
    compareMd5Hashes(currentPodfileLockChecksum, cachedPodfileLockChecksum)
  ) {
    cacheManager.set(packageJson.name, 'dependencies', currentDependenciesHash);
    cacheManager.set(packageJson.name, 'podfile', currentPodfileHash);
    cacheManager.set(
      packageJson.name,
      'podfileLock',
      currentPodfileLockChecksum ?? '',
    );
  } else {
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
      cacheManager.set(packageJson.name, 'podfile', currentPodfileHash);
      // We need to read again the checksum because value changed after running `pod install`
      currentPodfileLockChecksum = await getChecksum(podfileLockPath);
      cacheManager.set(
        packageJson.name,
        'podfileLock',
        currentPodfileLockChecksum ?? '',
      );
      loader.succeed();
    } catch (error) {
      loader.fail();
      throw new CLIError(
        `Something went wrong while installing CocoaPods. Please run ${pico.bold(
          'pod install',
        )} manually`,
        error as Error,
      );
    }
  }
}

export async function execaPod(args: string[], options?: execa.Options) {
  let podType: 'system' | 'bundle' = 'system';

  try {
    // try bundle pod first
    await execa('bundle', ['exec', 'pod', '--version'], options);
    podType = 'bundle';
  } catch (bundlePodError) {
    // try to install bundle pod
    try {
      await execa('bundle', ['install']);
      await execa('bundle', ['exec', 'pod', '--version'], options);
      podType = 'bundle';
    } catch (bundleInstallError) {
      // fall back to system pod
      try {
        await execa('pod', ['--version'], options);
        podType = 'system';
      } catch (systemPodError) {
        throw new Error('cocoapods not installed');
      }
    }
  }

  if (podType === 'bundle') {
    return execa('bundle', ['exec', 'pod', ...args], options);
  }
  return execa('pod', args, options);
}
