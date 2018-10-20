/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const copyProjectTemplateAndReplace = require('./copyProjectTemplateAndReplace');
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

/**
 * @param destPath Create the new project at this path.
 * @param newProjectName For example 'AwesomeApp'.
 * @param template Template to use, for example 'navigation'.
 * @param yarnVersion Version of yarn available on the system, or null if
 *                    yarn is not available. For example '0.18.1'.
 */
function createProjectFromTemplate(
  destPath,
  newProjectName,
  template,
  yarnVersion,
) {
  // Expand the basic 'HelloWorld' template
  copyProjectTemplateAndReplace(
    path.resolve(
      'node_modules',
      'react-native',
      'local-cli',
      'templates',
      'HelloWorld',
    ),
    destPath,
    newProjectName,
  );

  if (template === undefined) {
    // No specific template, use just the HelloWorld template above
    return;
  }

  // Keep the files from the 'HelloWorld' template, and overwrite some of them
  // with the specified project template.
  // The 'HelloWorld' template contains the native files (these are used by
  // all templates) and every other template only contains additional JS code.
  // Reason:
  // This way we don't have to duplicate the native files in every template.
  // If we duplicated them we'd make RN larger and risk that people would
  // forget to maintain all the copies so they would go out of sync.
  createFromRemoteTemplate(template, destPath, newProjectName, yarnVersion);
}

/**
 * The following formats are supported for the template:
 * - 'demo' -> Fetch the package react-native-template-demo from npm
 * - git://..., http://..., file://... or any other URL supported by npm
 */
function createFromRemoteTemplate(
  template,
  destPath,
  newProjectName,
  yarnVersion,
) {
  let installPackage;
  let templateName;
  if (template.includes('://')) {
    // URL, e.g. git://, file://
    installPackage = template;
    templateName = template.substr(template.lastIndexOf('/') + 1);
  } else {
    // e.g 'demo'
    installPackage = 'react-native-template-' + template;
    templateName = installPackage;
  }

  // Check if the template exists
  console.log(`Fetching template ${installPackage}...`);
  try {
    if (yarnVersion) {
      execSync(`yarn add ${installPackage} --ignore-scripts`, {
        stdio: 'inherit',
      });
    } else {
      execSync(
        `npm install ${installPackage} --save --save-exact --ignore-scripts`,
        {stdio: 'inherit'},
      );
    }
    const templatePath = path.resolve('node_modules', templateName);
    copyProjectTemplateAndReplace(templatePath, destPath, newProjectName, {
      // Every template contains a dummy package.json file included
      // only for publishing the template to npm.
      // We want to ignore this dummy file, otherwise it would overwrite
      // our project's package.json file.
      ignorePaths: [
        'package.json',
        'dependencies.json',
        'devDependencies.json',
      ],
    });
    installTemplateDependencies(templatePath, yarnVersion);
    installTemplateDevDependencies(templatePath, yarnVersion);
  } finally {
    // Clean up the temp files
    try {
      if (yarnVersion) {
        execSync(`yarn remove ${templateName} --ignore-scripts`);
      } else {
        execSync(`npm uninstall ${templateName} --ignore-scripts`);
      }
    } catch (err) {
      // Not critical but we still want people to know and report
      // if this the clean up fails.
      console.warn(
        `Failed to clean up template temp files in node_modules/${templateName}. ` +
          'This is not a critical error, you can work on your app.',
      );
    }
  }
}

function installTemplateDependencies(templatePath, yarnVersion) {
  // dependencies.json is a special file that lists additional dependencies
  // that are required by this template
  const dependenciesJsonPath = path.resolve(templatePath, 'dependencies.json');
  console.log('Adding dependencies for the project...');
  if (!fs.existsSync(dependenciesJsonPath)) {
    console.log('No additional dependencies.');
    return;
  }

  let dependencies;
  try {
    dependencies = JSON.parse(fs.readFileSync(dependenciesJsonPath));
  } catch (err) {
    throw new Error(
      "Could not parse the template's dependencies.json: " + err.message,
    );
  }
  for (let depName in dependencies) {
    const depVersion = dependencies[depName];
    const depToInstall = depName + '@' + depVersion;
    console.log('Adding ' + depToInstall + '...');
    if (yarnVersion) {
      execSync(`yarn add ${depToInstall}`, {stdio: 'inherit'});
    } else {
      execSync(`npm install ${depToInstall} --save --save-exact`, {
        stdio: 'inherit',
      });
    }
  }
  console.log("Linking native dependencies into the project's build files...");
  execSync('react-native link', {stdio: 'inherit'});
}

function installTemplateDevDependencies(templatePath, yarnVersion) {
  // devDependencies.json is a special file that lists additional develop dependencies
  // that are required by this template
  const devDependenciesJsonPath = path.resolve(
    templatePath,
    'devDependencies.json',
  );
  console.log('Adding develop dependencies for the project...');
  if (!fs.existsSync(devDependenciesJsonPath)) {
    console.log('No additional develop dependencies.');
    return;
  }

  let dependencies;
  try {
    dependencies = JSON.parse(fs.readFileSync(devDependenciesJsonPath));
  } catch (err) {
    throw new Error(
      "Could not parse the template's devDependencies.json: " + err.message,
    );
  }
  for (let depName in dependencies) {
    const depVersion = dependencies[depName];
    const depToInstall = depName + '@' + depVersion;
    console.log('Adding ' + depToInstall + '...');
    if (yarnVersion) {
      execSync(`yarn add ${depToInstall} -D`, {stdio: 'inherit'});
    } else {
      execSync(`npm install ${depToInstall} --save-dev --save-exact`, {
        stdio: 'inherit',
      });
    }
  }
}

module.exports = {
  createProjectFromTemplate,
};
