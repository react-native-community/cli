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
import installPods from '../../tools/installPods';
import {processTemplateName} from './templateName';
import banner from './banner';
import {getLoader} from '../../tools/loader';
import {CLIError} from '@react-native-community/cli-tools';

type Options = {|
  template?: string,
  npm?: boolean,
|};

async function setProjectDirectory({projectName, directory}) {
  const projectDirectory =
    directory || path.relative(process.cwd(), projectName);
  const projectDirectoryExists = await fs.pathExists(projectDirectory);

  if (projectDirectoryExists) {
    const {shouldReplaceprojectDirectory} = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldReplaceprojectDirectory',
        message: `Directory "${projectDirectory}" already exists, do you want to replace it?`,
      },
    ]);

    if (!shouldReplaceprojectDirectory) {
      throw new DirectoryAlreadyExistsError(projectDirectory);
    }

    await fs.emptyDir(projectDirectory);
  }

  try {
    mkdirp.sync(projectDirectory);
    process.chdir(projectDirectory);
  } catch (error) {
    throw new CLIError(
      `Error occurred while trying to ${
        projectDirectoryExists ? 'replace' : 'create'
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
  version,
  npm,
  directory,
}: {
  projectName: string,
  templateName: string,
  version?: string,
  npm?: boolean,
  directory?: string,
}) {
  logger.debug('Initializing new project');
  logger.log(banner);

  await setProjectDirectory({projectName, directory});

  const Loader = getLoader();
  const loader = new Loader({text: 'Downloading template'});
  const templateSourceDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rncli-init-template-'),
  );

  if (version && semver.valid(version) && !semver.gte(version, '0.60.0-rc.0')) {
    throw new Error(
      'Cannot use React Native CLI to initialize project with version lower than 0.60.0.',
    );
  }

  try {
    loader.start();
    let {uri, name} = await processTemplateName(
      version ? `${templateName}@${version}` : templateName,
    );

    await installTemplatePackage(uri, templateSourceDir, npm);

    loader.succeed();
    loader.start('Copying template');

    name = adjustNameIfUrl(name, templateSourceDir);
    const templateConfig = getTemplateConfig(name, templateSourceDir);
    await copyTemplate(name, templateConfig.templateDir, templateSourceDir);

    loader.succeed();
    loader.start('Processing template');

    changePlaceholderInTemplate(projectName, templateConfig.placeholderName);

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
  loader.start('Installing all required dependencies');

  await PackageManager.installAll({
    preferYarn: !npm,
    silent: true,
  });

  if (process.platform === 'darwin') {
    await installPods({projectName, loader});
  }

  loader.succeed();
}

async function createProject(
  projectName: string,
  options: Options,
  version: string,
) {
  if (options.template) {
    return createFromTemplate({
      projectName,
      templateName: options.template,
      npm: options.npm,
      directory: options.directory,
    });
  }

  return createFromTemplate({
    projectName,
    templateName: 'react-native',
    version,
    npm: options.npm,
    directory: options.directory,
  });
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

  try {
    await createProject(projectName, options, version);

    printRunInstructions(process.cwd(), projectName);
  } catch (e) {
    logger.error(e.message);
    fs.removeSync(projectName);
  }
});
