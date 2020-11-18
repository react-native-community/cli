#!/usr/bin/env nodes

/**
 * Script to update metro monorepo to current latest version on npm
 * This script wiil update all package.json
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const glob = require('glob').sync;
const chalk = require('chalk');

/**
 * Fetches the current latest version of specific package
 */
const getLatestVersion = (pkgName) => {
  const latestVersion = cp.execSync(`npm show ${pkgName} version`, {
    encoding: 'utf8',
  });
  return `^${latestVersion.trim()}`;
};

/**
 * Updates metro version in specific object (dependencies)
 */
const updateDependencies = (depsObject) => {
  const updatedJson = Object.keys(depsObject).reduce((result, packageName) => {
    if (!packageName.includes('metro')) {
      return depsObject;
    }
    const prevVersion = depsObject[packageName];
    const latestVersion = getLatestVersion(packageName);
    if (latestVersion !== prevVersion) {
      console.log(
        `Updated ${packageName} ${prevVersion} -> ${chalk.cyan(latestVersion)}`,
      );
    }
    return Object.assign(depsObject, {[packageName]: latestVersion});
  }, depsObject);

  return updatedJson;
};

const start = new Date().getTime();
['./package.json', ...glob('./packages/*/package.json')].forEach((pkgPath) => {
  const pkg = require(path.join(process.cwd(), pkgPath));

  const updatedDependency = pkg.dependencies
    ? Object.assign(pkg, {
        dependencies: updateDependencies(pkg.dependencies),
      })
    : pkg;
  const updatedDevDependency = pkg.devDependencies
    ? Object.assign(updatedDependency, {
        devDependencies: updateDependencies(pkg.devDependencies),
      })
    : updatedDependency;

  fs.writeFileSync(
    pkgPath,
    `${JSON.stringify(updatedDevDependency, null, 2)}\n`,
  );
});
const end = new Date().getTime();
const ellapsedTime = (end - start) / 1000;
console.log(`✨ Done in ${ellapsedTime}s.`);
