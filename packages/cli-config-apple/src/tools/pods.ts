import path from 'path';
import fs from 'fs-extra';
import {createHash} from 'crypto';
import chalk from 'chalk';
import {
  CLIError,
  cacheManager,
  getLoader,
  logger,
} from '@react-native-community/cli-tools';
import installPods from './installPods';
import {
  DependencyConfig,
  IOSDependencyConfig,
} from '@react-native-community/cli-types';
import {ApplePlatform} from '../types';
import runCodegen from './runCodegen';

interface ResolvePodsOptions {
  forceInstall?: boolean;
  newArchEnabled?: boolean;
}

interface NativeDependencies {
  [key: string]: DependencyConfig;
}

function checkGemfileForCocoaPods(gemfilePath: string): boolean {
  try {
    const gemfileContent = fs.readFileSync(gemfilePath, 'utf-8');
    // Check for common CocoaPods gem declarations, because some projects might have Gemfile but for other purposes
    return /^\s*gem\s+['"]cocoapods['"]/.test(gemfileContent);
  } catch (error) {
    logger.debug(`Failed to read Gemfile at: ${gemfilePath}`);
    logger.debug(String(error));
    return false;
  }
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
    });
    const gemfilePath = path.join(root, 'Gemfile');
    let useBundler = checkGemfileForCocoaPods(gemfilePath);

    if (!useBundler) {
      logger.debug(
        `Could not find the Gemfile at: ${chalk.cyan(gemfilePath)}
  The default React Native Template uses Gemfile to leverage Ruby Bundler and we advice the same.
  If you use Gemfile, make sure it's ${chalk.bold(
    'in the project root directory',
  )}.
  Falling back to installing CocoaPods using globally installed "pod".`,
      );
    }

    await installPods(loader, {
      useBundler,
      iosFolderPath,
      root,
    });
    cacheManager.set(packageJson.name, 'dependencies', currentDependenciesHash);
    loader.succeed();
  } catch (error) {
    loader.fail();
    throw new CLIError(
      `Something when wrong while installing CocoaPods. Please run ${chalk.bold(
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
    try {
      await install(
        packageJson,
        currentDependenciesHash,
        platformFolderPath,
        platformName,
        root,
        reactNativePath,
      );
      cacheManager.set(packageJson.name, 'podfile', currentPodfileHash);
      // We need to read again the checksum because value changed after running `pod install`
      currentPodfileLockChecksum = await getChecksum(podfileLockPath);
      cacheManager.set(
        packageJson.name,
        'podfileLock',
        currentPodfileLockChecksum ?? '',
      );
    } catch (error) {
      throw new CLIError(
        `Something when wrong while installing CocoaPods. Please run ${chalk.bold(
          'pod install',
        )} manually`,
        error as Error,
      );
    }
  }
}
