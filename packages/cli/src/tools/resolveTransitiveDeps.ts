import path from 'path';
import fs from 'fs-extra';
import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {prompt} from 'prompts';

interface DependencyInfo {
  path: string;
  peerDependencies: {[key: string]: string};
}

function getPeerDependencies(root: string): Map<string, DependencyInfo> {
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = require(packageJsonPath);

  const dependenciesAndPeerDependencies = new Map<string, DependencyInfo>();

  for (const dependency in {...packageJson.dependencies}) {
    const dependencyPath = path.join(root, 'node_modules', dependency);

    if (fs.existsSync(dependencyPath)) {
      const packageJsonPath = path.join(dependencyPath, 'package.json');
      const packageJson = require(packageJsonPath);

      if (
        packageJson.peerDependencies &&
        !dependenciesAndPeerDependencies.has(dependency)
      ) {
        dependenciesAndPeerDependencies.set(dependency, {
          path: dependencyPath,
          peerDependencies: packageJson.peerDependencies,
        });
      }
    }
  }

  return dependenciesAndPeerDependencies;
}

function excludeInstalledPeerDependencies(
  root: string,
  peerDependencies: Map<string, DependencyInfo>,
) {
  const missingPeerDependencies: Record<string, Record<string, string>> = {};

  peerDependencies.forEach((value, key) => {
    const missingDeps = Object.entries(value.peerDependencies).reduce(
      (missingDepsList, [name, version]) => {
        const rootPath = path.join(root, 'node_modules', name);
        if (!fs.existsSync(rootPath)) {
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

  const peerDependencies = getPeerDependencies(root);
  const depsToInstall = excludeInstalledPeerDependencies(
    root,
    peerDependencies,
  );
  const dependenciesWithMissingDeps = Object.keys(depsToInstall);
  if (dependenciesWithMissingDeps.length > 0) {
    logger.warn(
      `Looks like you are missing some of the peer dependencies of your libraries:
      ${dependenciesWithMissingDeps.map(
        (dep) =>
          `${chalk.bold(dep)}:\n ${Object.keys(depsToInstall[dep]).map(
            (d) => `\t-${d}\n`,
          )}`,
      )}`,
    );
    const {install} = await prompt({
      type: 'confirm',
      name: 'install',
      message: 'Do you want to install them now?',
    });
    console.log({install});
  }
}
