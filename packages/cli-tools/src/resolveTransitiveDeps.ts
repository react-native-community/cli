import fs from 'fs-extra';
import path from 'path';
import * as npmRegistryFetch from 'npm-registry-fetch';
import chalk from 'chalk';
import {prompt} from 'prompts';
import execa from 'execa';
import semver from 'semver';
import {getLoader, logger} from '@react-native-community/cli-tools';
import {DependencyMap} from '@react-native-community/cli-types';
import {isProjectUsingYarn} from './yarn';

export async function fetchAvailableVersions(
  packageName: string,
): Promise<string[]> {
  const response = await npmRegistryFetch.json(`/${packageName}`);

  return Object.keys(response.versions || {});
}

export function calculateWorkingVersion(
  ranges: string[],
  availableVersions: string[],
): string | null {
  const sortedVersions = availableVersions
    .filter((version) =>
      ranges.every((range) => semver.satisfies(version, range)),
    )
    .sort(semver.rcompare);

  return sortedVersions.length > 0 ? sortedVersions[0] : null;
}

export function findDependencyPath(
  dependencyName: string,
  rootPath: string,
  parentPath: string,
) {
  let dependencyPath;
  const topLevelPath = path.join(rootPath, 'node_modules', dependencyName);
  const nestedPath = path.join(parentPath, 'node_modules', dependencyName);

  if (fs.existsSync(topLevelPath)) {
    dependencyPath = topLevelPath;
  } else if (fs.existsSync(nestedPath)) {
    dependencyPath = nestedPath;
  }

  return dependencyPath;
}

export function filterNativeDependencies(
  root: string,
  dependencies: DependencyMap,
) {
  const depsWithNativePeers = new Map<string, Map<string, string>>();

  dependencies.forEach((value, key) => {
    if (value.peerDependencies) {
      const nativeDependencies = new Map<string, string>();

      Object.entries(value.peerDependencies).forEach(([name, versions]) => {
        const dependencyPath = findDependencyPath(name, root, value.path);

        if (dependencyPath) {
          const iosPath = path.join(dependencyPath, 'ios');
          const androidPath = path.join(dependencyPath, 'android');

          if (fs.existsSync(iosPath) || fs.existsSync(androidPath)) {
            nativeDependencies.set(name, versions);
          }
        }
      });

      if (nativeDependencies.size > 0) {
        depsWithNativePeers.set(key, nativeDependencies);
      }
    }
  });

  return depsWithNativePeers;
}

export function filterInstalledPeers(
  root: string,
  peers: Map<string, Map<string, string>>,
) {
  const data: Record<string, Record<string, string>> = {};
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = require(packageJsonPath);
  const dependencyList = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  peers.forEach((peerDependencies, dependency) => {
    peerDependencies.forEach((version, name) => {
      if (!Object.keys(dependencyList).includes(name)) {
        data[dependency] = {
          ...data[dependency],
          [name]: version,
        };
      }
    });
  });

  return data;
}

export function findPeerDepsToInstall(
  root: string,
  dependencies: DependencyMap,
) {
  const rootPackageJson = require(path.join(root, 'package.json'));
  const dependencyList = {
    ...rootPackageJson.dependencies,
    ...rootPackageJson.devDependencies,
  };
  const peerDependencies = new Set<string>();
  Array.from(dependencies.entries()).forEach(([_, value]) => {
    if (value.peerDependencies) {
      Object.keys(value.peerDependencies).forEach((name) => {
        if (!Object.keys(dependencyList).includes(name)) {
          peerDependencies.add(name);
        }
      });
    }
  });

  return peerDependencies;
}
export function getMissingPeerDepsForYarn(
  root: string,
  dependencies: DependencyMap,
) {
  const depsToInstall = findPeerDepsToInstall(root, dependencies);
  return depsToInstall;
}

// install peer deps with yarn without making any changes to package.json and yarn.lock
export function yarnSilentInstallPeerDeps(
  root: string,
  missingPeerDependencies: DependencyMap,
) {
  const dependenciesToInstall = getMissingPeerDepsForYarn(
    root,
    missingPeerDependencies,
  );

  const packageJsonPath = path.join(root, 'package.json');
  const lockfilePath = path.join(root, 'yarn.lock');

  if (dependenciesToInstall.size > 0) {
    const binPackageJson = fs.readFileSync(packageJsonPath, {
      encoding: 'utf8',
    });
    const binLockfile = fs.readFileSync(lockfilePath, {
      encoding: 'utf8',
    });

    if (!binPackageJson) {
      logger.error('package.json is missing');
      return;
    }

    if (!binLockfile) {
      logger.error('yarn.lock is missing');
      return;
    }
    const loader = getLoader({text: 'Looking for peer dependencies...'});

    loader.start();
    try {
      execa.sync('yarn', ['add', ...dependenciesToInstall]);
      loader.succeed();
    } catch {
      loader.fail('Failed to verify peer dependencies');
      return;
    }

    fs.writeFileSync(packageJsonPath, binPackageJson, {encoding: 'utf8'});
    fs.writeFileSync(lockfilePath, binLockfile, {encoding: 'utf8'});
  }
}

export async function promptForMissingPeerDependencies(
  dependencies: Record<string, Record<string, string>>,
): Promise<boolean> {
  logger.warn(
    'Looks like you are missing some of the peer dependencies of your libraries:\n',
  );
  logger.log(
    Object.entries(dependencies)
      .map(
        ([dependencyName, peerDependencies]) =>
          `\t${chalk.bold(dependencyName)}:\n ${Object.entries(
            peerDependencies,
          ).map(
            ([peerDependency, peerDependencyVersion]) =>
              `\t- ${peerDependency} ${peerDependencyVersion}\n`,
          )}`,
      )
      .join('\n')
      .replace(/,/g, ''),
  );

  const {install} = await prompt({
    type: 'confirm',
    name: 'install',
    message:
      'Do you want to install them now? The matching versions will be added as project dependencies and become visible for autolinking.',
  });
  return install;
}

export async function getPackagesVersion(
  missingDependencies: Record<string, Record<string, string>>,
) {
  const packageToRanges: {[pkg: string]: string[]} = {};

  for (const dependency in missingDependencies) {
    const packages = missingDependencies[dependency];

    for (const packageName in packages) {
      if (!packageToRanges[packageName]) {
        packageToRanges[packageName] = [];
      }
      packageToRanges[packageName].push(packages[packageName]);
    }
  }

  const workingVersions: {[pkg: string]: string | null} = {};

  for (const packageName in packageToRanges) {
    const ranges = packageToRanges[packageName];
    const availableVersions = await fetchAvailableVersions(packageName);
    const workingVersion = calculateWorkingVersion(ranges, availableVersions);

    if (workingVersion !== null) {
      workingVersions[packageName] = workingVersion;
    } else {
      logger.warn(
        `Could not find a version that matches all ranges for ${chalk.bold(
          packageName,
        )}. Please resolve this issue manually.`,
      );
    }
  }

  return workingVersions;
}

export function installMissingPackages(
  packages: Record<string, string | null>,
  yarn = true,
) {
  const packageVersions = Object.entries(packages).map(
    ([name, version]) => `${name}@^${version}`,
  );
  const flattenList = ([] as string[]).concat(...packageVersions);

  const loader = getLoader({text: 'Installing peer dependencies...'});
  loader.start();
  try {
    const deps = flattenList.map((dep) => dep);
    if (yarn) {
      execa.sync('yarn', ['add', ...deps]);
    } else {
      execa.sync('npm', ['install', ...deps]);
    }
    loader.succeed();

    return deps;
  } catch (error) {
    loader.fail();

    return [];
  }
}

export async function resolveTransitiveDeps(
  root: string,
  dependencyMap: DependencyMap,
) {
  const isYarn = !!isProjectUsingYarn(root);

  if (isYarn) {
    yarnSilentInstallPeerDeps(root, dependencyMap);
  }
  const nonEmptyPeers = filterNativeDependencies(root, dependencyMap);
  const nonInstalledPeers = filterInstalledPeers(root, nonEmptyPeers);

  if (Object.keys(nonInstalledPeers).length > 0) {
    const installDeps = await promptForMissingPeerDependencies(
      nonInstalledPeers,
    );

    if (installDeps) {
      const packagesVersions = await getPackagesVersion(nonInstalledPeers);

      return installMissingPackages(packagesVersions, isYarn);
    }
  }

  return [];
}
