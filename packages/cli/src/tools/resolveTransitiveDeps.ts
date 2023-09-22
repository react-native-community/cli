import path from 'path';
import fs from 'fs-extra';
import {getLoader, logger} from '@react-native-community/cli-tools';
import * as fetch from 'npm-registry-fetch';
import chalk from 'chalk';
import {prompt} from 'prompts';
import execa from 'execa';
import semver from 'semver';
import {isProjectUsingYarn} from './yarn';
import {installPods} from '@react-native-community/cli-doctor';

interface DependencyInfo {
  path: string;
  peerDependencies: {[key: string]: string};
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

function getPeerDependencies(
  root: string,
  packageJson: any,
): Map<string, DependencyInfo> {
  const dependenciesAndPeerDependencies = new Map<string, DependencyInfo>();

  for (const dependency in packageJson.dependencies) {
    const dependencyPath = path.join(root, 'node_modules', dependency);

    if (fs.existsSync(dependencyPath)) {
      const dependencyPackageJson = require(path.join(
        dependencyPath,
        'package.json',
      ));
      const peerDependenciesMeta = dependencyPackageJson.peerDependenciesMeta;

      let optionalDeps: string[] = [];
      if (peerDependenciesMeta) {
        const peers = Object.keys(peerDependenciesMeta);
        optionalDeps = peers.filter(
          (p) => peerDependenciesMeta[p].optional === true,
        );
      }

      if (
        dependencyPackageJson.peerDependencies &&
        !dependenciesAndPeerDependencies.has(dependency)
      ) {
        dependenciesAndPeerDependencies.set(dependency, {
          path: dependencyPath,
          peerDependencies: Object.keys(dependencyPackageJson.peerDependencies)
            .filter((key) => !optionalDeps.includes(key))
            .reduce<Record<string, string>>((result, key) => {
              result[key] = dependencyPackageJson.peerDependencies[key];
              return result;
            }, {}),
        });
      }
    }
  }

  return dependenciesAndPeerDependencies;
}

function excludeInstalledPeerDependencies(
  root: string,
  peerDependencies: Map<string, DependencyInfo>,
  packageJson: any,
) {
  const missingPeerDependencies: Record<string, Record<string, string>> = {};
  peerDependencies.forEach((value, key) => {
    const missingDeps = Object.entries(value.peerDependencies).reduce(
      (missingDepsList, [name, version]) => {
        const rootPath = path.join(root, 'node_modules', name);
        if (
          (fs.existsSync(path.join(rootPath, 'ios')) ||
            fs.existsSync(path.join(rootPath, 'android'))) &&
          !Object.keys(packageJson.dependencies).includes(name)
        ) {
          //@ts-ignore
          missingDepsList[name] = version;
        }
        return missingDepsList;
      },
      {},
    );

    if (Object.keys(missingDeps).length > 0) {
      missingPeerDependencies[key] = missingDeps;
    }
  });

  return missingPeerDependencies;
}

export default async function installTransitiveDeps() {
  const root = process.cwd();
  const isYarn = !!isProjectUsingYarn(root);

  let newDependenciesFound = true;

  while (newDependenciesFound) {
    const packageJsonPath = path.join(root, 'package.json');
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, {encoding: 'utf8'}),
    );
    const peerDependencies = getPeerDependencies(root, packageJson);
    const depsToInstall = excludeInstalledPeerDependencies(
      root,
      peerDependencies,
      packageJson,
    );
    const dependenciesWithMissingDeps = Object.keys(depsToInstall);

    if (dependenciesWithMissingDeps.length > 0) {
      logger.warn(
        'Looks like you are missing some of the peer dependencies of your libraries:\n',
      );
      logger.log(
        dependenciesWithMissingDeps
          .map(
            (dep) =>
              `\t${chalk.bold(dep)}:\n ${Object.keys(depsToInstall[dep]).map(
                (d) => `\t- ${d}\n`,
              )}`,
          )
          .join('\n')
          .replace(/,/g, ''),
      );

      const packageToRanges: {[pkg: string]: string[]} = {};

      for (const dependency in depsToInstall) {
        const packages = depsToInstall[dependency];

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
        workingVersions[packageName] = workingVersion;
      }

      const {install} = await prompt({
        type: 'confirm',
        name: 'install',
        message:
          'Do you want to install them now? The matching versions will be added as project dependencies and become visible for autolinking.',
      });
      const loader = getLoader({text: 'Installing peer dependencies...'});

      if (install) {
        const arr = Object.entries(workingVersions).map(
          ([name, version]) => `${name}@^${version}`,
        );
        //@ts-ignore
        const flat = [].concat(...arr);

        loader.start();

        if (isYarn) {
          execa.sync('yarn', ['add', ...flat.map((dep) => dep)]);
        } else {
          execa.sync('npm', ['install', ...flat.map((dep) => dep)]);
        }
        loader.succeed();
      } else {
        newDependenciesFound = false;
      }
    } else {
      newDependenciesFound = false;
    }
  }

  return !newDependenciesFound;
}

export async function resolvePodsInstallation() {
  const {install} = await prompt({
    type: 'confirm',
    name: 'install',
    message:
      'Do you want to install pods? This will make sure your transitive dependencies are linked properly.',
  });

  if (install && process.platform === 'darwin') {
    const loader = getLoader({text: 'Installing pods...'});
    loader.start();
    await installPods(loader);
    loader.succeed();
  }
}
