import {installPods} from '@react-native-community/cli-doctor';
import fs from 'fs-extra';
import path from 'path';
import * as fetch from 'npm-registry-fetch';
import chalk from 'chalk';
import {prompt} from 'prompts';
import execa from 'execa';
import semver from 'semver';
import generateFileHash from './generateFileHash';
import {getLoader} from './loader';
import logger from './logger';

interface DependencyData {
  path: string;
  version: string;
  peerDependencies: {[key: string]: string};
  duplicates?: DependencyData[];
}

function isUsingYarn(root: string) {
  return fs.existsSync(path.join(root, 'yarn.lock'));
}

function writeFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, {encoding: 'utf8'});
}

async function fetchAvailableVersions(packageName: string): Promise<string[]> {
  const response = await fetch.json(`/${packageName}`);

  return Object.keys(response.versions || {});
}

async function calculateWorkingVersion(
  ranges: string[],
  availableVersions: string[],
): Promise<string | null> {
  const sortedVersions = availableVersions
    .filter((version) =>
      ranges.every((range) => semver.satisfies(version, range)),
    )
    .sort(semver.rcompare);

  return sortedVersions.length > 0 ? sortedVersions[0] : null;
}

function findDependencyPath(
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

function collectDependencies(root: string): Map<string, DependencyData> {
  const dependencies = new Map<string, DependencyData>();

  const checkDependency = (dependencyPath: string) => {
    const packageJsonPath = path.join(dependencyPath, 'package.json');
    const packageJson = require(packageJsonPath);

    if (dependencies.has(packageJson.name)) {
      const dependency = dependencies.get(packageJson.name) as DependencyData;

      if (
        dependencyPath !== dependency.path &&
        dependency.duplicates?.every(
          (duplicate) => duplicate.path !== dependencyPath,
        )
      ) {
        dependencies.set(packageJson.name, {
          ...dependency,
          duplicates: [
            ...dependency.duplicates,
            {
              path: dependencyPath,
              version: packageJson.version,
              peerDependencies: packageJson.peerDependencies,
            },
          ],
        });
      }
      return;
    }

    dependencies.set(packageJson.name, {
      path: dependencyPath,
      version: packageJson.version,
      peerDependencies: packageJson.peerDependencies,
      duplicates: [],
    });

    for (const dependency in {
      ...packageJson.dependencies,
      ...(root === dependencyPath ? packageJson.devDependencies : {}),
    }) {
      const depPath = findDependencyPath(dependency, root, dependencyPath);

      if (depPath) {
        checkDependency(depPath);
      }
    }
  };

  checkDependency(root);

  return dependencies;
}

function filterNativeDependencies(
  root: string,
  dependencies: Map<string, DependencyData>,
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

function filterInstalledPeers(
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

function findPeerDepsToInstall(
  root: string,
  dependencies: Map<string, DependencyData>,
) {
  const rootPackageJson = require(path.join(root, 'package.json'));
  const dependencyList = {
    ...rootPackageJson.dependencies,
    ...rootPackageJson.devDependencies,
  };
  const peerDependencies = new Set<string>();
  dependencies.forEach((value) => {
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
async function getMissingPeerDepsForYarn(root: string) {
  const dependencies = collectDependencies(root);
  const depsToInstall = findPeerDepsToInstall(root, dependencies);

  return depsToInstall;
}

// install peer deps with yarn without making any changes to package.json and yarn.lock
async function yarnSilentInstallPeerDeps(root: string) {
  const dependenciesToInstall = await getMissingPeerDepsForYarn(root);
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
    const loader = getLoader({text: 'Verifying dependencies...'});

    loader.start();
    try {
      execa.sync('yarn', ['add', ...dependenciesToInstall]);
      loader.succeed();
    } catch {
      loader.fail('Failed to verify peer dependencies');
      return;
    }

    writeFile(packageJsonPath, binPackageJson);
    writeFile(lockfilePath, binLockfile);
  }
}

async function findPeerDepsForAutolinking(root: string) {
  const deps = collectDependencies(root);
  const nonEmptyPeers = filterNativeDependencies(root, deps);
  const nonInstalledPeers = filterInstalledPeers(root, nonEmptyPeers);

  return nonInstalledPeers;
}

async function promptForMissingPeerDependencies(
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

async function getPackagesVersion(
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
    const workingVersion = await calculateWorkingVersion(
      ranges,
      availableVersions,
    );

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

function installMissingPackages(
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

    return true;
  } catch (error) {
    loader.fail();

    return false;
  }
}

async function resolveTransitiveDeps() {
  const root = process.cwd();
  const isYarn = isUsingYarn(root);

  if (isYarn) {
    await yarnSilentInstallPeerDeps(root);
  }

  const missingPeerDependencies = await findPeerDepsForAutolinking(root);

  if (Object.keys(missingPeerDependencies).length > 0) {
    const installDeps = await promptForMissingPeerDependencies(
      missingPeerDependencies,
    );

    if (installDeps) {
      const packagesVersions = await getPackagesVersion(
        missingPeerDependencies,
      );

      return installMissingPackages(packagesVersions, isYarn);
    }
  }

  return false;
}

async function resolvePodsInstallation() {
  const {install} = await prompt({
    type: 'confirm',
    name: 'install',
    message:
      'Do you want to install pods? This will make sure your transitive dependencies are linked properly.',
  });

  if (install) {
    const loader = getLoader({text: 'Installing pods...'});
    loader.start();
    await installPods(loader);
    loader.succeed();
  }
}

export default async function checkTransitiveDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const preInstallHash = generateFileHash(packageJsonPath);
  const areTransitiveDepsInstalled = await resolveTransitiveDeps();
  const postInstallHash = generateFileHash(packageJsonPath);

  if (
    process.platform === 'darwin' &&
    areTransitiveDepsInstalled &&
    preInstallHash !== postInstallHash
  ) {
    await resolvePodsInstallation();
  }
}
