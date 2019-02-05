/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import { execSync } from 'child_process';
import fs from 'fs';
import minimist from 'minimist';
import path from 'path';
import process from 'process';
import printRunInstructions from '../generator/printRunInstructions';
import { createProjectFromTemplate } from '../generator/templates';
import yarn from '../util/yarn';
import logger from '../util/logger';

/**
 * Creates the template for a React Native project given the provided
 * parameters:
 * @param projectDir Templates will be copied here.
 * @param argsOrName Project name or full list of custom arguments
 *                   for the generator.
 * @param options Command line options passed from the react-native-cli directly.
 *                E.g. `{ version: '0.43.0', template: 'navigation' }`
 */
function init(projectDir, argsOrName) {
  const args = Array.isArray(argsOrName)
    ? argsOrName // argsOrName was e.g. ['AwesomeApp', '--verbose']
    : [argsOrName].concat(process.argv.slice(4)); // argsOrName was e.g. 'AwesomeApp'

  // args array is e.g. ['AwesomeApp', '--verbose', '--template', 'navigation']
  if (!args || args.length === 0) {
    logger.error('react-native init requires a project name.');
    return;
  }

  const newProjectName = args[0];
  const options = minimist(args);

  logger.info(`Setting up new React Native app in ${projectDir}`);
  generateProject(projectDir, newProjectName, options);
}

/**
 * Generates a new React Native project based on the template.
 * @param Absolute path at which the project folder should be created.
 * @param options Command line arguments parsed by minimist.
 */
function generateProject(destinationRoot, newProjectName, options) {
  // eslint-disable-next-line import/no-unresolved
  const reactNativePackageJson = require('react-native/package.json');
  const { peerDependencies } = reactNativePackageJson;
  if (!peerDependencies) {
    logger.error(
      "Missing React peer dependency in React Native's package.json. Aborting."
    );
    return;
  }

  const reactVersion = peerDependencies.react;
  if (!reactVersion) {
    logger.error(
      "Missing React peer dependency in React Native's package.json. Aborting."
    );
    return;
  }

  const yarnVersion =
    !options.npm &&
    yarn.getYarnVersionIfAvailable() &&
    yarn.isGlobalCliUsingYarn(destinationRoot);

  createProjectFromTemplate(
    destinationRoot,
    newProjectName,
    options.template,
    yarnVersion
  );

  if (yarnVersion) {
    logger.info('Adding React...');
    execSync(`yarn add react@${reactVersion}`, { stdio: 'inherit' });
  } else {
    logger.info('Installing React...');
    execSync(`npm install react@${reactVersion} --save --save-exact`, {
      stdio: 'inherit',
    });
  }
  if (!options['skip-jest']) {
    const jestDeps = `jest babel-jest metro-react-native-babel-preset react-test-renderer@${reactVersion}`;
    if (yarnVersion) {
      logger.info('Adding Jest...');
      execSync(`yarn add ${jestDeps} --dev --exact`, { stdio: 'inherit' });
    } else {
      logger.info('Installing Jest...');
      execSync(`npm install ${jestDeps} --save-dev --save-exact`, {
        stdio: 'inherit',
      });
    }
    addJestToPackageJson(destinationRoot);
  }
  printRunInstructions(destinationRoot, newProjectName);
}

/**
 * Add Jest-related stuff to package.json, which was created by the react-native-cli.
 */
function addJestToPackageJson(destinationRoot) {
  const packageJSONPath = path.join(destinationRoot, 'package.json');
  const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath));

  packageJSON.scripts.test = 'jest';
  packageJSON.jest = {
    preset: 'react-native',
  };
  fs.writeFileSync(
    packageJSONPath,
    `${JSON.stringify(packageJSON, null, 2)}\n`
  );
}

module.exports = init;
