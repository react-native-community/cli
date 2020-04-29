/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * script to build (transpile) files.
 * By default it transpiles js files for all packages and writes them
 * into `build/` directory.
 * Non-js files not matching IGNORE_PATTERN will be copied without transpiling.
 *
 * Example:
 *  node ./scripts/build.js
 *  node ./scripts/build.js /users/123/jest/packages/jest-111/src/111.js
 *
 * NOTE: this script is node@4 compatible
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const mkdirp = require('mkdirp');
const babel = require('@babel/core');
const chalk = require('chalk');
const micromatch = require('micromatch');
const {
  PACKAGES_DIR,
  getPackages,
  OK,
  adjustToTerminalWidth,
} = require('./helpers');

const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const JS_FILES_PATTERN = '**/*.js';
const TS_FILE_PATTERN = '**/*.ts';
const IGNORE_PATTERN = '**/__{tests,mocks,fixtures}__/**';

const transformOptions = require('../babel.config.js');

function getPackageName(file) {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file, buildFolder) {
  const pkgName = getPackageName(file);
  const pkgSrcPath = path.resolve(PACKAGES_DIR, pkgName, SRC_DIR);
  const pkgBuildPath = path.resolve(PACKAGES_DIR, pkgName, buildFolder);
  const relativeToSrcPath = path.relative(pkgSrcPath, file);
  return path.resolve(pkgBuildPath, relativeToSrcPath).replace(/\.ts$/, '.js');
}

function buildNodePackage(p) {
  const srcDir = path.resolve(p, SRC_DIR);
  const pattern = path.resolve(srcDir, '**/*');
  const files = glob.sync(pattern, {
    nodir: true,
  });

  process.stdout.write(adjustToTerminalWidth(`${path.basename(p)}\n`));

  files.forEach((file) => buildFile(file, true));
  process.stdout.write(`${OK}\n`);
}

function buildFile(file, silent) {
  const destPath = getBuildPath(file, BUILD_DIR);

  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    silent ||
      process.stdout.write(
        `${
          chalk.dim('  \u2022 ') + path.relative(PACKAGES_DIR, file)
        } (ignore)\n`,
      );
    return;
  }

  mkdirp.sync(path.dirname(destPath), '777');

  if (
    !micromatch.isMatch(file, JS_FILES_PATTERN) &&
    !micromatch.isMatch(file, TS_FILE_PATTERN)
  ) {
    fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    silent ||
      process.stdout.write(
        `${
          chalk.red('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.red(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath)
        } (copy)\n`,
      );
  } else {
    const options = Object.assign({}, transformOptions);
    const filename = path.basename(destPath);

    let {code, map} = babel.transformFileSync(file, options);

    if (!file.endsWith('.d.ts') && map.sources.length > 0) {
      code = `${code}\n\n//# sourceMappingURL=${filename}.map`;
      map.sources = [path.relative(path.dirname(destPath), file)];
      fs.writeFileSync(`${destPath}.map`, JSON.stringify(map));
    }

    fs.writeFileSync(destPath, code);

    silent ||
      process.stdout.write(
        `${
          chalk.green('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          chalk.green(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath)
        }\n`,
      );
  }
}

const files = process.argv.slice(2);

if (files.length) {
  files.forEach(buildFile);
} else {
  const packages = getPackages();
  process.stdout.write(chalk.inverse(' Building packages \n'));
  packages.forEach(buildNodePackage);
  process.stdout.write('\n');
}
