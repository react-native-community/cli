/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const { spawnSync } = require('child_process');
const yarn = require('../util/yarn');

const spawnOpts = {
  stdio: 'inherit',
  stdin: 'inherit',
};

/**
 * Execute npm or yarn command
 *
 * @param  {String} yarnCommand Yarn command to be executed eg. yarn add package
 * @param  {String} npmCommand  Npm command to be executed eg. npm install package
 * @param  {string} projectDir  Directory to run the command in
 * @return {object}             spawnSync's result object
 */
function callYarnOrNpm(yarnCommand, npmCommand, projectDir) {
  let command;

  const isYarnAvailable =
    yarn.getYarnVersionIfAvailable() && yarn.isGlobalCliUsingYarn(projectDir);

  if (isYarnAvailable) {
    command = yarnCommand;
  } else {
    command = npmCommand;
  }

  const args = command.split(' ');
  const cmd = args.shift();

  const res = spawnSync(cmd, args, spawnOpts);

  return res;
}

/**
 * Install package into project using npm or yarn if available
 * @param  {[type]} packageName Package to be installed
 * @param  {string} projectDir  Root directory of the project
 * @return {[type]}             spawnSync's result object
 */
function add(packageName, projectDir) {
  return callYarnOrNpm(
    `yarn add ${packageName}`,
    `npm install ${packageName} --save`,
    projectDir
  );
}

/**
 * Uninstall package from project using npm or yarn if available
 * @param  {[type]} packageName Package to be uninstalled
 * @param  {string} projectDir  Root directory of the project
 * @return {Object}             spawnSync's result object
 */
function remove(packageName, projectDir) {
  return callYarnOrNpm(
    `yarn remove ${packageName}`,
    `npm uninstall --save ${packageName}`,
    projectDir
  );
}

module.exports = {
  add,
  remove,
};
