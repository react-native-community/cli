import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import minimist from 'minimist';
import ora from 'ora';
import mkdirp from 'mkdirp';
import {validateProjectName} from './validate';
import DirectoryAlreadyExistsError from './errors/DirectoryAlreadyExistsError';
import printRunInstructions from './printRunInstructions';
import {CLIError, logger} from '@react-native-community/cli-tools';
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

const DEFAULT_VERSION = 'latest';

type Options = {
  template?: string;
  npm?: boolean;
  directory?: string;
  displayName?: string;
  title?: string;
};

interface TemplateOptions {
  projectName: string;
  templateName: string;
  npm?: boolean;
  directory: string;
  projectTitle?: string;
}

function doesDirectoryExist(dir: string) {
  return fs.existsSync(dir);
}

async function setProjectDirectory(directory: string) {
  if (doesDirectoryExist(directory)) {
    throw new DirectoryAlreadyExistsError(directory);
  }

  try {
    mkdirp.sync(directory);
    process.chdir(directory);
  } catch (error) {
    throw new CLIError(
      'Error occurred while trying to create project directory.',
      error,
    );
  }

  return process.cwd();
}

function adjustNameIfUrl(name: string, cwd: string) {
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
}: TemplateOptions) {
  logger.debug('Initializing new project');
  logger.log(banner);

  const projectDirectory = await setProjectDirectory(directory);

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
      placeholderTitle: templateConfig.titlePlaceholder,
    });

    loader.succeed();
    const {postInitScript} = templateConfig;
    if (postInitScript) {
      // Leaving trailing space because there may be stdout from the script
      loader.start('Executing post init script ');
      await executePostInitScript(name, postInitScript, templateSourceDir);
      loader.succeed();
    }

    await installDependencies({
      projectName,
      npm,
      loader,
      root: projectDirectory,
    });
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
  root,
}: {
  projectName: string;
  npm?: boolean;
  loader: ora.Ora;
  root: string;
}) {
  loader.start('Installing dependencies');

  await PackageManager.installAll({
    preferYarn: !npm,
    silent: true,
    root,
  });

  if (process.platform === 'darwin') {
    await installPods({projectName, loader});
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
  options: Options,
) {
  const root = process.cwd();

  validateProjectName(projectName);

  /**
   * Commander is stripping `version` from options automatically.
   * We have to use `minimist` to take that directly from `process.argv`
   */
  const version: string = minimist(process.argv).version || DEFAULT_VERSION;

  const directoryName = path.relative(root, options.directory || projectName);

  try {
    await createProject(projectName, directoryName, version, options);

    const projectFolder = path.join(root, directoryName);
    printRunInstructions(projectFolder, projectName);
  } catch (e) {
    logger.error(e.message);
  }
});
