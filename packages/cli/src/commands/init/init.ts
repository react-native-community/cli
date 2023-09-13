import os from 'os';
import path from 'path';
import fs from 'fs-extra';
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
  copyTemplate,
  executePostInitScript,
} from './template';
import {changePlaceholderInTemplate} from './editTemplate';
import * as PackageManager from '../../tools/packageManager';
import {installPods} from '@react-native-community/cli-doctor';
import banner from './banner';
import TemplateAndVersionError from './errors/TemplateAndVersionError';
import {getBunVersionIfAvailable} from '../../tools/bun';
import {getNpmVersionIfAvailable} from '../../tools/npm';
import {getYarnVersionIfAvailable} from '../../tools/yarn';

const DEFAULT_VERSION = 'latest';

type Options = {
  template?: string;
  npm?: boolean;
  pm?: PackageManager.PackageManager;
  directory?: string;
  displayName?: string;
  title?: string;
  skipInstall?: boolean;
  version?: string;
  packageName?: string;
};

interface TemplateOptions {
  projectName: string;
  templateUri: string;
  npm?: boolean;
  pm?: PackageManager.PackageManager;
  directory: string;
  projectTitle?: string;
  skipInstall?: boolean;
  packageName?: string;
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
      error as Error,
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
  projectName,
  templateUri,
  npm,
  pm,
  directory,
  projectTitle,
  skipInstall,
  packageName,
}: TemplateOptions) {
  logger.debug('Initializing new project');
  logger.log(banner);

  let packageManager = pm;

  if (pm) {
    packageManager = pm;
  } else {
    packageManager = userAgentPackageManager();
  }

  if (npm) {
    logger.warn(
      'Flag --npm is deprecated and will be removed soon. In the future, please use --pm npm instead.',
    );

    packageManager = 'npm';
  }

  const projectDirectory = await setProjectDirectory(directory);

  const loader = getLoader({text: 'Downloading template'});
  const templateSourceDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rncli-init-template-'),
  );

  try {
    loader.start();

    await installTemplatePackage(
      templateUri,
      templateSourceDir,
      packageManager,
    );

    loader.succeed();
    loader.start('Copying template');

    const templateName = getTemplateName(templateSourceDir);
    const templateConfig = getTemplateConfig(templateName, templateSourceDir);
    await copyTemplate(
      templateName,
      templateConfig.templateDir,
      templateSourceDir,
    );

    loader.succeed();
    loader.start('Processing template');

    await changePlaceholderInTemplate({
      projectName,
      projectTitle,
      placeholderName: templateConfig.placeholderName,
      placeholderTitle: templateConfig.titlePlaceholder,
      packageName,
    });

    loader.succeed();
    const {postInitScript} = templateConfig;
    if (postInitScript) {
      loader.info('Executing post init script ');
      await executePostInitScript(
        templateName,
        postInitScript,
        templateSourceDir,
      );
    }

    if (!skipInstall) {
      await installDependencies({
        packageManager,
        loader,
        root: projectDirectory,
      });
    } else {
      loader.succeed('Dependencies installation skipped');
    }
  } catch (e) {
    loader.fail();
    throw e;
  } finally {
    fs.removeSync(templateSourceDir);
  }
}

async function installDependencies({
  packageManager,
  loader,
  root,
}: {
  packageManager: PackageManager.PackageManager;
  loader: Loader;
  root: string;
}) {
  loader.start('Installing dependencies');

  await PackageManager.installAll({
    packageManager,
    silent: true,
    root,
  });

  if (process.platform === 'darwin') {
    await installPods(loader);
  }

  loader.succeed();
}

function checkPackageManagerAvailability(options: Options) {
  if (!options.pm) {
    return true;
  }

  if (options.pm === 'bun') {
    return getBunVersionIfAvailable();
  } else if (options.pm === 'npm') {
    return getNpmVersionIfAvailable();
  } else if (options.pm === 'yarn') {
    return getYarnVersionIfAvailable();
  }

  return false;
}

function createTemplateUri(options: Options, version: string): string {
  const isTypescriptTemplate =
    options.template === 'react-native-template-typescript';

  if (isTypescriptTemplate) {
    logger.warn(
      "Ignoring custom template: 'react-native-template-typescript'. Starting from React Native v0.71 TypeScript is used by default.",
    );
    return 'react-native';
  }

  return options.template || `react-native@${version}`;
}

async function createProject(
  projectName: string,
  directory: string,
  version: string,
  options: Options,
) {
  const templateUri = createTemplateUri(options, version);

  return createFromTemplate({
    projectName,
    templateUri,
    npm: options.npm,
    pm: options.pm,
    directory,
    projectTitle: options.title,
    skipInstall: options.skipInstall,
    packageName: options.packageName,
  });
}

function userAgentPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.startsWith('yarn')) {
      return 'yarn';
    }
    if (userAgent.startsWith('npm')) {
      return 'npm';
    }
    if (userAgent.startsWith('bun')) {
      return 'bun';
    }
  }

  return 'yarn';
}

export default (async function initialize(
  [projectName]: Array<string>,
  options: Options,
) {
  validateProjectName(projectName);

  if (!!options.template && !!options.version) {
    throw new TemplateAndVersionError(options.template);
  }

  const root = process.cwd();
  const version = options.version || DEFAULT_VERSION;
  const directoryName = path.relative(root, options.directory || projectName);

  if (!checkPackageManagerAvailability(options)) {
    logger.error(
      'Seems like the package manager you want to use is not installed. Please install it or choose another package manager.',
    );
    return;
  }

  await createProject(projectName, directoryName, version, options);

  const projectFolder = path.join(root, directoryName);
  printRunInstructions(projectFolder, projectName);
});
