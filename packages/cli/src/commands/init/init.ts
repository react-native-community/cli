import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import {validateProjectName} from './validate';
import {prompt} from 'prompts';
import chalk from 'chalk';
import DirectoryAlreadyExistsError from './errors/DirectoryAlreadyExistsError';
import printRunInstructions from './printRunInstructions';
import {
  CLIError,
  logger,
  getLoader,
  Loader,
  cacheManager,
} from '@react-native-community/cli-tools';
import {installPods} from '@react-native-community/cli-platform-ios';
import {
  installTemplatePackage,
  getTemplateConfig,
  copyTemplate,
  executePostInitScript,
} from './template';
import {changePlaceholderInTemplate} from './editTemplate';
import * as PackageManager from '../../tools/packageManager';
import banner from './banner';
import TemplateAndVersionError from './errors/TemplateAndVersionError';
import {getBunVersionIfAvailable} from '../../tools/bun';
import {getNpmVersionIfAvailable} from '../../tools/npm';
import {getYarnVersionIfAvailable} from '../../tools/yarn';
import {createHash} from 'crypto';
import execa from 'execa';

const DEFAULT_VERSION = 'latest';
const packageJson = require('./../../../package.json');

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
  installPods?: string | boolean;
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
  installCocoaPods?: string | boolean;
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

//set cache to empty string to prevent installing cocoapods on freshly created project
function setEmptyHashForCachedDependencies(projectName: string) {
  cacheManager.set(
    projectName,
    'dependencies',
    createHash('md5').update('').digest('hex'),
  );
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
  installCocoaPods,
}: TemplateOptions) {
  logger.debug('Initializing new project');
  logger.log(banner);

  let packageManager = pm;

  if (pm) {
    packageManager = pm;
  } else {
    const userAgentPM = userAgentPackageManager();
    // if possible, use the package manager from the user agent. Otherwise fallback to default (yarn)
    packageManager = userAgentPM || 'yarn';
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

      if (process.platform === 'darwin') {
        const installPodsValue = String(installCocoaPods);

        if (installPodsValue === 'true') {
          await installPods(loader);
          loader.succeed();
          setEmptyHashForCachedDependencies(projectName);
        } else if (installPodsValue === 'undefined') {
          const {installCocoapods} = await prompt({
            type: 'confirm',
            name: 'installCocoapods',
            message: `Do you want to install CocoaPods now? ${chalk.reset.dim(
              'Only needed if you run your project in Xcode directly',
            )}`,
          });

          if (installCocoapods) {
            await installPods(loader);
            loader.succeed();
            setEmptyHashForCachedDependencies(projectName);
          }
        }
      }
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

  loader.succeed();
}

function checkPackageManagerAvailability(
  packageManager: PackageManager.PackageManager,
) {
  if (packageManager === 'bun') {
    return getBunVersionIfAvailable();
  } else if (packageManager === 'npm') {
    return getNpmVersionIfAvailable();
  } else if (packageManager === 'yarn') {
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
    installCocoaPods: options.installPods,
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

  return null;
}

const createGitRepository = async (folder: string) => {
  const loader = getLoader();

  try {
    await execa('git', ['--version'], {stdio: 'ignore'});
  } catch {
    loader.fail('Unable to initialize Git repo. `git` not in $PATH.');
    return;
  }

  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree'], {
      stdio: 'ignore',
      cwd: folder,
    });
    loader.succeed(
      'New project is already inside of a Git repo, skipping git init.',
    );
    return;
  } catch {}

  loader.start('Initializing Git repository');

  try {
    await execa('git', ['init'], {cwd: folder});
    await execa('git', ['branch', '-M', 'main'], {cwd: folder});
    await execa('git', ['add', '.'], {cwd: folder});
    await execa(
      'git',
      [
        'commit',
        '-m',
        `Initial commit\n\nGenerated by ${packageJson.name} ${packageJson.version}.`,
      ],
      {
        cwd: folder,
      },
    );
    loader.succeed();
  } catch (e) {
    loader.fail(
      'Could not create an empty Git repository, see debug logs with --verbose',
    );
    logger.debug(e as string);
  }
};

export default (async function initialize(
  [projectName]: Array<string>,
  options: Options,
) {
  if (!projectName) {
    const {projName} = await prompt({
      type: 'text',
      name: 'projName',
      message: 'How would you like to name the app?',
    });
    projectName = projName;
  }

  validateProjectName(projectName);

  if (!!options.template && !!options.version) {
    throw new TemplateAndVersionError(options.template);
  }

  const root = process.cwd();
  const version = options.version || DEFAULT_VERSION;
  const directoryName = path.relative(root, options.directory || projectName);

  if (options.pm && !checkPackageManagerAvailability(options.pm)) {
    logger.error(
      'Seems like the package manager you want to use is not installed. Please install it or choose another package manager.',
    );
    return;
  }

  await createProject(projectName, directoryName, version, options);

  const projectFolder = path.join(root, directoryName);

  await createGitRepository(projectFolder);
  printRunInstructions(projectFolder, projectName);
});
