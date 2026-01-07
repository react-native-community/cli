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
const glob = require('tinyglobby');
const babel = require('@babel/core');
const pico = require('picocolors');
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
const FILES_WITH_755_PERMISSION = ['launchPackager.command'];

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
  const files = glob.globSync(pattern, {expandDirectories: false});

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
          pico.dim('  \u2022 ') + path.relative(PACKAGES_DIR, file)
        } (ignore)\n`,
      );
    return;
  }

  fs.mkdirSync(path.dirname(destPath), {mode: 0o777, recursive: true});

  const fileName = path.basename(file);

  if (
    !micromatch.isMatch(file, JS_FILES_PATTERN) &&
    !micromatch.isMatch(file, TS_FILE_PATTERN)
  ) {
    if (FILES_WITH_755_PERMISSION.includes(fileName)) {
      fs.createReadStream(file).pipe(
        fs.createWriteStream(destPath, {mode: 0o755}),
      );
    } else {
      fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    }
    silent ||
      process.stdout.write(
        `${
          pico.red('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          pico.red(' \u21D2 ') +
          path.relative(PACKAGES_DIR, destPath)
        } (copy)\n`,
      );
  } else {
    const options = {
      ...transformOptions,
      sourceMaps: true,
      sourceFileName: path.basename(file),
    };

    let {code, map} = babel.transformFileSync(file, options);

    if (!file.endsWith('.d.ts')) {
      const outDir = path.dirname(destPath);
      const outFile = path.basename(destPath);
      const mapFileName = `${outFile}.map`;
      const mapPath = path.join(outDir, mapFileName);

      // Normalize/override key fields for consistency
      map.file = outFile;
      map.sources = [path.relative(outDir, file).replace(/\\/g, '/')];

      code = `${code}\n\n//# sourceMappingURL=${mapFileName}`;
      fs.writeFileSync(mapPath, JSON.stringify(map));
    }

    fs.writeFileSync(destPath, code);

    silent ||
      process.stdout.write(
        `${
          pico.green('  \u2022 ') +
          path.relative(PACKAGES_DIR, file) +
          pico.green(' \u21D2 ') +
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
  process.stdout.write(pico.inverse(' Building packages \n'));
  packages.forEach(buildNodePackage);
  process.stdout.write('\n');
}
