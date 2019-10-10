/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import minimist from 'minimist';
import path from 'path';
import process from 'process';
import printRunInstructions from './printRunInstructions';
import {createProjectFromTemplate} from '../../tools/generator/templates';
import * as PackageManager from '../../tools/packageManager';
import {logger} from '@react-native-community/cli-tools';
import installPods from '../../tools/installPods';

/**
 * Creates the template for a React Native project given the provided
 * parameters:
 * @param projectDir Templates will be copied here.
 * @param argsOrName Project name or full list of custom arguments
 *                   for the generator.
 * @param options Command line options passed from the react-native-cli directly.
 *                E.g. `{ version: '0.43.0', template: 'navigation' }`
 */
async function initCompat(projectDir: string, argsOrName: string | string[]) {
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
  await generateProject(projectDir, newProjectName, options);
}

/**
 * Generates a new React Native project based on the template.
 * @param Absolute path at which the project folder should be created.
 * @param options Command line arguments parsed by minimist.
 */
async function generateProject(
  destinationRoot: string,
  newProjectName: string,
  options: any,
) {
  const pkgJson = require('react-native/package.json');
  const reactVersion = pkgJson.peerDependencies.react;

  await createProjectFromTemplate(
    destinationRoot,
    newProjectName,
    options.template,
  );

  logger.info('Adding required dependencies');
  await PackageManager.install([`react@${reactVersion}`], {
    root: destinationRoot,
  });

  logger.info('Adding required dev dependencies');
  await PackageManager.installDev(
    [
      '@babel/core',
      '@babel/runtime',
      '@react-native-community/eslint-config',
      'eslint',
      'jest',
      'babel-jest',
      'metro-react-native-babel-preset',
      `react-test-renderer@${reactVersion}`,
    ],
    {
      root: destinationRoot,
    },
  );

  addJestToPackageJson(destinationRoot);

  if (process.platform === 'darwin') {
    logger.info('Installing required CocoaPods dependencies');

    await installPods({projectName: newProjectName});
  }

  printRunInstructions(destinationRoot, newProjectName);
}

/**
 * Add Jest-related stuff to package.json, which was created by the react-native-cli.
 */
function addJestToPackageJson(destinationRoot: string) {
  const packageJSONPath = path.join(destinationRoot, 'package.json');
  const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath).toString());

  packageJSON.scripts.test = 'jest';
  packageJSON.scripts.lint = 'eslint .';
  packageJSON.jest = {
    preset: 'react-native',
  };
  fs.writeFileSync(
    packageJSONPath,
    `${JSON.stringify(packageJSON, null, 2)}\n`,
  );
}

export default initCompat;
