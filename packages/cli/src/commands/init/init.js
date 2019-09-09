// @flow
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import Ora from 'ora';
import minimist from 'minimist';
import semver from 'semver';
import inquirer from 'inquirer';
import mkdirp from 'mkdirp';
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
// $FlowFixMe - converted to TS
import installPods from '../../tools/installPods';
import {processTemplateName} from './templateName';
import banner from './banner';
// $FlowFixMe - converted to TS
import {getLoader} from '../../tools/loader';
import {CLIError} from '@react-native-community/cli-tools';

const DEFAULT_VERSION = 'latest';

type Options = {|
  template?: string,
  npm?: boolean,
  directory?: string,
  displayName?: string,
  title?: string,
|};

function doesDirectoryExist(dir: string) {
  return fs.existsSync(dir);
}

function getProjectDirectory({projectName, directory}): string {
  return path.relative(process.cwd(), directory || projectName);
}

async function setProjectDirectory(directory) {
  const directoryExists = doesDirectoryExist(directory);
  if (directoryExists) {
    const {shouldReplaceprojectDirectory} = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldReplaceprojectDirectory',
        message: `Directory "${directory}" already exists, do you want to replace it?`,
        default: false,
      },
    ]);

    if (!shouldReplaceprojectDirectory) {
      throw new DirectoryAlreadyExistsError(directory);
    }

    fs.emptyDirSync(directory);
  }

  try {
    mkdirp.sync(directory);
    process.chdir(directory);
  } catch (error) {
    throw new CLIError(
      `Error occurred while trying to ${
        directoryExists ? 'replace' : 'create'
      } project directory.`,
      error,
    );
  }
}

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

async function createFromTemplate({
  projectName,
  templateName,
  npm,
  directory,
  projectTitle,
}: {
  projectName: string,
  templateName: string,
  npm?: boolean,
  directory: string,
  projectTitle?: string,
}) {
  logger.debug('Initializing new project');
  logger.log(banner);

  await setProjectDirectory(directory);

  const Loader = getLoader();
  const loader = new Loader({text: 'Downloading template'});
  const templateSourceDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rncli-init-template-'),
  );

  try {
    loader.start();
    let {uri, name} = await processTemplateName(templateName);

    await installTemplatePackage(uri, templateSourceDir, npm);

    loader.succeed();
    loader.start('Copying template');

    name = adjustNameIfUrl(name, templateSourceDir);
    const templateConfig = getTemplateConfig(name, templateSourceDir);
    await copyTemplate(name, templateConfig.templateDir, templateSourceDir);

    loader.succeed();
    loader.start('Processing template');

    changePlaceholderInTemplate({
      projectName,
      projectTitle,
      placeholderName: templateConfig.placeholderName,
      titlePlaceholder: templateConfig.titlePlaceholder,
    });

    loader.succeed();
    const {postInitScript} = templateConfig;
    if (postInitScript) {
      // Leaving trailing space because there may be stdout from the script
      loader.start('Executing post init script ');
      await executePostInitScript(name, postInitScript, templateSourceDir);
      loader.succeed();
    }

    await installDependencies({projectName, npm, loader});
  } catch (e) {
    loader.fail();
    throw new Error(e);
  } finally {
    fs.removeSync(templateSourceDir);
  }
}

async function installDependencies({
  projectName,
  npm,
  loader,
}: {
  projectName: string,
  npm?: boolean,
  loader: typeof Ora,
}) {
  loader.start('Installing dependencies');

  await PackageManager.installAll({
    preferYarn: !npm,
    silent: true,
  });

  if (process.platform === 'darwin') {
    await installPods({projectName, loader, shouldUpdatePods: false});
  }

  loader.succeed();
}

async function createProject(
  projectName: string,
  directory: string,
  version: string,
  options: Options,
) {
  const templateName = options.template || `react-native@${version}`;

  if (
    version !== DEFAULT_VERSION &&
    semver.valid(version) &&
    !semver.gte(version, '0.60.0-rc.0')
  ) {
    throw new Error(
      'Cannot use React Native CLI to initialize project with version lower than 0.60.0.',
    );
  }

  return createFromTemplate({
    projectName,
    templateName,
    npm: options.npm,
    directory,
    projectTitle: options.title,
  });
}

export default (async function initialize(
  [projectName]: Array<string>,
  context: ConfigT,
  options: Options,
) {
  const rootFolder = context.root;

  validateProjectName(projectName);

  /**
   * Commander is stripping `version` from options automatically.
   * We have to use `minimist` to take that directly from `process.argv`
   */
  const version: string = minimist(process.argv).version || DEFAULT_VERSION;

  const directoryName = getProjectDirectory({
    projectName,
    directory: options.directory || projectName,
  });

  try {
    await createProject(projectName, directoryName, version, options);

    const projectFolder = path.join(rootFolder, projectName);
    printRunInstructions(projectFolder, projectName);
  } catch (e) {
    logger.error(e.message);
  }
});
