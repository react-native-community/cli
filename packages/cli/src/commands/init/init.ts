import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import minimist from 'minimist';
import {validateProjectName} from './validate';
import DirectoryAlreadyExistsError from './errors/DirectoryAlreadyExistsError';
import printRunInstructions from './printRunInstructions';
import {
  CLIError,
  logger,
  getLoader,
  Loader,
} from '@react-native-community/cli-tools';
import {
  installTemplatePackage,
  getTemplateConfig,
  executePostInitScript,
} from './template';
import {
  copyTemplateAndReplacePlaceholders,
  overridePlaceholderTitle,
} from './editTemplate';
import * as PackageManager from '../../tools/packageManager';
import {installPods} from '@react-native-community/cli-doctor';
import banner from './banner';

const DEFAULT_VERSION = 'latest';

type Options = {
  template?: string;
  npm?: boolean;
  directory?: string;
  displayName?: string;
  title?: string;
  skipInstall?: boolean;
};

interface TemplateOptions {
  templateUri: string;
  npm?: boolean;
  directory: string;
  projectTitle?: string;
  skipInstall?: boolean;
}

function doesDirectoryExist(dir: string) {
  return fs.existsSync(dir);
}

async function setProjectDirectory(directory: string) {
  if (doesDirectoryExist(directory)) {
    throw new DirectoryAlreadyExistsError(directory);
  }

  try {
    fs.mkdirSync(directory, {recursive: true});
    process.chdir(directory);
  } catch (error) {
    throw new CLIError(
      'Error occurred while trying to create project directory.',
      error,
    );
  }

  return process.cwd();
}

function getTemplateName(cwd: string) {
  // We use package manager to infer the name of the template module for us.
  // That's why we get it from temporary package.json, where the name is the
  // first and only dependency (hence 0).
  const name = Object.keys(
    JSON.parse(fs.readFileSync(path.join(cwd, './package.json'), 'utf8'))
      .dependencies,
  )[0];
  return name;
}

async function createFromTemplate({
  templateUri,
  npm,
  directory,
  projectTitle,
  skipInstall,
}: TemplateOptions) {
  logger.debug('Initializing new project');
  logger.log(banner);

  const projectDirectory = await setProjectDirectory(directory);

  const loader = getLoader({text: 'Downloading template'});
  const templateSourceDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rncli-init-template-'),
  );

  try {
    loader.start();

    await installTemplatePackage(templateUri, templateSourceDir, npm);

    loader.succeed();
    loader.start('Copying template & Processing template');

    const templateName = getTemplateName(templateSourceDir);
    const templateConfig = getTemplateConfig(templateName, templateSourceDir);
    const placeholders = templateConfig.placeholders || {};
    overridePlaceholderTitle(projectTitle, placeholders);
    await copyTemplateAndReplacePlaceholders(
      templateName,
      templateConfig.templateDir,
      templateSourceDir,
      placeholders,
    );

    loader.succeed();
    const {postInitScript} = templateConfig;
    if (postInitScript) {
      // Leaving trailing space because there may be stdout from the script
      loader.start('Executing post init script ');
      await executePostInitScript(
        templateName,
        postInitScript,
        templateSourceDir,
      );
      loader.succeed();
    }

    if (!skipInstall) {
      await installDependencies({
        npm,
        loader,
        root: projectDirectory,
        directory,
      });
    } else {
      loader.succeed('Dependencies installation skipped');
    }
  } catch (e) {
    loader.fail();
    throw new Error(e);
  } finally {
    fs.removeSync(templateSourceDir);
  }
}

async function installDependencies({
  directory,
  npm,
  loader,
  root,
}: {
  directory: string;
  npm?: boolean;
  loader: Loader;
  root: string;
}) {
  loader.start('Installing dependencies');

  await PackageManager.installAll({
    preferYarn: !npm,
    silent: true,
    root,
  });

  if (process.platform === 'darwin') {
    await installPods({directory, loader});
  }

  loader.succeed();
}

async function createProject(
  directory: string,
  version: string,
  options: Options,
) {
  const templateUri = options.template || `react-native@${version}`;

  return createFromTemplate({
    templateUri,
    npm: options.npm,
    directory,
    projectTitle: options.title,
    skipInstall: options.skipInstall,
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
    await createProject(directoryName, version, options);

    const projectFolder = path.join(root, directoryName);
    printRunInstructions(projectFolder, projectName);
  } catch (e) {
    logger.error(e.message);
  }
});
