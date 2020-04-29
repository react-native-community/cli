/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Watch files for changes and rebuild (copy from 'src/' to `build/`) if changed
 */

const fs = require('fs');
const {execSync} = require('child_process');
const path = require('path');
const chalk = require('chalk');
const chokidar = require('chokidar');
const {getPackages} = require('./helpers');

const BUILD_CMD = `node ${path.resolve(__dirname, './build.js')}`;

let filesToBuild = new Map();

const rebuild = (filename) => filesToBuild.set(filename, true);

const onChange = (srcDir) => {
  return (filePath) => {
    const filename = path.basename(filePath);

    console.log(chalk.green('->'), `change: ${filename}`);
    rebuild(filePath);
  };
};

const onUnlink = (srcDir) => {
  return (filePath) => {
    const buildFile = filePath
      .replace(`${path.sep}src${path.sep}`, `${path.sep}build${path.sep}`)
      .replace('.ts', '.js');

    try {
      fs.unlinkSync(buildFile);
      process.stdout.write(
        `${
          chalk.red('  \u2022 ') +
          path.relative(path.resolve(srcDir, '..', '..'), buildFile)
        } (deleted)\n`,
      );
    } catch (e) {
      // omit
    }
  };
};

getPackages().forEach((p) => {
  const srcDir = path.resolve(p, 'src');

  try {
    fs.accessSync(srcDir, fs.F_OK);
    const watcher = chokidar.watch(srcDir);

    watcher.on('ready', () => {
      watcher.on('change', onChange(srcDir));
      watcher.on('add', onChange(srcDir));
      watcher.on('unlink', onUnlink(srcDir));
    });
  } catch (e) {
    // doesn't exist
  }
});

setInterval(() => {
  const files = Array.from(filesToBuild.keys());
  if (files.length) {
    filesToBuild = new Map();
    try {
      execSync(`${BUILD_CMD} ${files.join(' ')}`, {stdio: [0, 1, 2]});
    } catch (e) {
      // omit
    }
  }
}, 100);

console.log(chalk.red('->'), chalk.cyan('Watching for changes...'));
