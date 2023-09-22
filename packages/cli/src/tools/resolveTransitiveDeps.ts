import path from 'path';
import fs from 'fs-extra';
import {getLoader, logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {prompt} from 'prompts';
import execa from 'execa';
import semver from 'semver';

interface DependencyInfo {
  path: string;
  peerDependencies: {[key: string]: string};
}

function isUsingYarn(root: string) {
  return fs.existsSync(path.join(root, 'yarn.lock'));
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
  yarn = true,
) {
  const packageJson = require(path.join(root, 'package.json'));
  const missingPeerDependencies: Record<string, Record<string, string>> = {};
  peerDependencies.forEach((value, key) => {
    const missingDeps = Object.entries(value.peerDependencies).reduce(
      (missingDepsList, [name, version]) => {
        const rootPath = path.join(root, 'node_modules', name);
        if (
          (yarn && !fs.existsSync(rootPath)) ||
          (!yarn &&
            (fs.existsSync(path.join(rootPath, 'ios')) ||
              fs.existsSync(path.join(rootPath, 'android'))) &&
            !Object.keys(packageJson.dependencies).includes(name))
        ) {
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

function getMatchingPackageVersion(
  packageName: string,
  range: string,
  yarn = true,
) {
  if (yarn) {
    const {stdout} = execa.sync('yarn', [
      'info',
      packageName,
      'versions',
      '--json',
    ]);
    const versions = JSON.parse(stdout).data as string[];
    const satisfying = versions.filter((version) =>
      semver.satisfies(version, range),
    );
    const maxSatisfying = semver.maxSatisfying(satisfying, range);

    return maxSatisfying;
  } else {
    const {stdout} = execa.sync('npm', [
      'view',
      `${packageName}@${range}`,
      'version',
      '--json',
    ]);
    const versions = JSON.parse(stdout);
    const maxSatisfying = semver.maxSatisfying(versions, range);
    return maxSatisfying;
  }
}

function flattenSemver(input) {
  const result = {};
  input.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (result[key]) {
        if (value !== '*' && result[key] !== '*') {
          result[key] = `${result[key]} && ${value}`;
        }
      } else {
        result[key] = value;
      }
    });
  });

  return result;
}

export default async function installTransitiveDeps() {
  const root = process.cwd();
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = require(packageJsonPath);
  const isYarn = isUsingYarn(root);
  const peerDependencies = getPeerDependencies(root, packageJson);
  const depsToInstall = excludeInstalledPeerDependencies(
    root,
    peerDependencies,
    isYarn,
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
    const {install} = await prompt({
      type: 'confirm',
      name: 'install',
      message:
        'Do you want to install them now? The matching versions will be added as project dependencies and become visible for autolinking.',
    });
    const loader = getLoader({text: 'Installing peer dependencies...'});

    if (install) {
      let deps = {} as Record<string, string>;
      const semverRanges = flattenSemver(Object.values(depsToInstall));

      dependenciesWithMissingDeps.map((dep) => {
        const missingDeps = depsToInstall[dep];
        Object.entries(missingDeps).map(([name]) => {
          const version = getMatchingPackageVersion(
            name,
            semverRanges[name],
            isYarn,
          );
          if (version) {
            deps[name] = version;
          }
        });
      });
      loader.start();

      if (isYarn) {
        execa.sync('yarn', [
          'add',
          ...Object.entries(deps).map(([k, v]) => `${k}@^${v}`),
        ]);
      } else {
        execa.sync('npm', [
          'install',
          ...Object.entries(deps).map(([k, v]) => `${k}@^${v}`),
        ]);
      }
      loader.succeed();
    }
  }
}
