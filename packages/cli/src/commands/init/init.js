// @flow
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import Ora from 'ora';
import minimist from 'minimist';
import semver from 'semver';
import inquirer from 'inquirer';
import type {ConfigT} from 'types';
import {validateProjectName} from './validate';
import DirectoryAlreadyExistsError from './errors/DirectoryAlreadyExistsError';
import printRunInstructions from './printRunInstructions';
import {logger} from '@react-native-community/cli-tools';
import {
  installTemplatePackage,
  getTemplateConfig,
  copyTemplate,
  executePostInitScript,
} from './template';
import {changePlaceholderInTemplate} from './editTemplate';
import * as PackageManager from '../../tools/packageManager';
import {processTemplateName} from './templateName';
import banner from './banner';
import {getLoader} from '../../tools/loader';

type Options = {|
  template?: string,
  npm?: boolean,
|};

function adjustNameIfUrl(name, cwd) {
  // We use package manager to infer the name of the template module for us.
  // That's why we get it from temporary package.json, where the name is the
  // first and only dependency (hence 0).
  if (name.match(/https?:/)) {
    name = Object.keys(
      JSON.parse(fs.readFileSync(path.join(cwd, './package.json'), 'utf8'))
        .dependencies,
    )[0];
  }
  return name;
}

async function createFromExternalTemplate(
  projectName: string,
  templateName: string,
  npm?: boolean,
) {
  logger.debug('Initializing new project from external template');
  logger.log(banner);

  const Loader = getLoader();

  const loader = new Loader({text: 'Downloading template'});
  loader.start();

  const templateSourceDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rncli-init-template-'),
  );
  try {
    let {uri, name} = await processTemplateName(templateName);
    await installTemplatePackage(uri, templateSourceDir, npm);
    loader.succeed();
    loader.start('Copying template');

    name = adjustNameIfUrl(name, templateSourceDir);
    const templateConfig = getTemplateConfig(name, templateSourceDir);
    await copyTemplate(name, templateConfig.templateDir, templateSourceDir);

    loader.succeed();
    loader.start('Preparing template');

    changePlaceholderInTemplate(projectName, templateConfig.placeholderName);

    loader.succeed();
    const {postInitScript} = templateConfig;
    if (postInitScript) {
      // Leaving trailing space because there may be stdout from the script
      loader.start('Executing post init script');
      await executePostInitScript(name, postInitScript, templateSourceDir);
      loader.succeed();
    }

    loader.start('Installing all required dependencies');
    await installDependencies({npm, loader});
  } catch (e) {
    loader.fail();
    throw new Error(e);
  } finally {
    fs.removeSync(templateSourceDir);
  }
}

async function installDependencies({
  npm,
  loader,
}: {
  npm?: boolean,
  loader: typeof Ora,
}) {
  const {error} = await PackageManager.installAll({
    preferYarn: !npm,
    silent: true,
  });
  loader.succeed();

  // TODO: if this is different than debian just return
  if (!error) {
    return;
  }

  if (error === PackageManager.ERRORS.failedToRunPodInstall) {
    return logger.warn(
      'Failed to run "pod install", please try to run it manually.',
    );
  }

  if (error === PackageManager.ERRORS.noCocoaPods) {
    const {shouldInstallCocoaPods} = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldInstallCocoaPods',
        message: 'CocoaPods is not installed, Do you want to install it?',
      },
    ]);

    if (shouldInstallCocoaPods) {
      try {
        await PackageManager.installCocoaPods();
      } catch (err) {
        throw new Error(
          'Error occurred while trying to install CocoaPods, please install it manually.',
        );
      }

      try {
        loader.start('Installing pods');
        await PackageManager.installPods({silent: true});
        return loader.succeed();
      } catch (err) {
        return logger.warn(
          'Failed to run "pod install", please try to run it manually.',
        );
      }
    }

    return logger.warn(
      'Please install CocoaPods and run "pod install" to install all dependencies.',
    );
  }
}

async function createFromReactNativeTemplate(
  projectName: string,
  version: string,
  npm?: boolean,
) {
  logger.debug('Initializing new project');
  logger.log(banner);

  const Loader = getLoader();
  const loader = new Loader({text: 'Downloading template'});
  loader.start();
  const templateSourceDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rncli-init-template-'),
  );
  try {
    if (semver.valid(version) && !semver.gte(version, '0.60.0')) {
      throw new Error(
        'Cannot use React Native CLI to initialize project with version lower than 0.60.0',
      );
    }

    const TEMPLATE_NAME = 'react-native';

    const {uri} = await processTemplateName(`${TEMPLATE_NAME}@${version}`);

    await installTemplatePackage(uri, templateSourceDir, npm);

    loader.succeed();
    loader.start('Copying template');

    const templateConfig = getTemplateConfig(TEMPLATE_NAME, templateSourceDir);
    await copyTemplate(
      TEMPLATE_NAME,
      templateConfig.templateDir,
      templateSourceDir,
    );

    loader.succeed();
    loader.start('Processing template');

    changePlaceholderInTemplate(projectName, templateConfig.placeholderName);

    loader.succeed();
    const {postInitScript} = templateConfig;
    if (postInitScript) {
      loader.start('Executing post init script');
      await executePostInitScript(
        TEMPLATE_NAME,
        postInitScript,
        templateSourceDir,
      );
      loader.succeed();
    }

    loader.start('Installing all required dependencies');
    await installDependencies({npm, loader});
  } catch (e) {
    loader.fail();
    throw new Error(e);
  } finally {
    fs.removeSync(templateSourceDir);
  }
}

function createProject(projectName: string, options: Options, version: string) {
  fs.mkdirSync(projectName);
  process.chdir(projectName);

  if (options.template) {
    return createFromExternalTemplate(
      projectName,
      options.template,
      options.npm,
    );
  }

  return createFromReactNativeTemplate(projectName, version, options.npm);
}

export default (async function initialize(
  [projectName]: Array<string>,
  _context: ConfigT,
  options: Options,
) {
  validateProjectName(projectName);

  /**
   * Commander is stripping `version` from options automatically.
   * We have to use `minimist` to take that directly from `process.argv`
   */
  const version: string = minimist(process.argv).version || 'latest';

  if (fs.existsSync(projectName)) {
    throw new DirectoryAlreadyExistsError(projectName);
  }

  try {
    await createProject(projectName, options, version);

    printRunInstructions(process.cwd(), projectName);
  } catch (e) {
    logger.error(e.message);
    fs.removeSync(projectName);
  }
});
