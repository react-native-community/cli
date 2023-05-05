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
import addNodeLinker from '../../tools/addNodeLinker';
import {getYarnVersionIfAvailable} from '../../tools/yarn';
import semver from 'semver';
import prompts from 'prompts';
import findUp from 'find-up';
import {parse, stringify} from 'yaml';

const DEFAULT_VERSION = 'latest';

type Options = {
  template?: string;
  npm?: boolean;
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

async function overwriteYarnrcFile(filePath: string, fileContent: any) {
  logger.info(
    'Detected ".yarnrc.yml" file but it doesn\'t contain "nodeLinker: node-modules". To create React Native project you need to use "node-modules" as "nodeLinker"',
  );

  const {value} = await prompts({
    type: 'confirm',
    name: 'value',
    message:
      'Do you want to add "nodeLinker: node-modules" to "yarnrc.yml" file?',
    initial: true,
  });

  if (value) {
    fileContent.nodeLinker = 'node-modules';
    fs.writeFileSync(filePath, stringify(fileContent), {
      encoding: 'utf8',
      flag: 'w',
    });
  } else {
    throw new CLIError(
      'In order to create React Native app you need to use "node-modules" as "nodeLinker" in ".yarnrc.yml", or use Yarn Classic.',
    );
  }
}

async function createFromTemplate({
  projectName,
  templateUri,
  npm,
  directory,
  projectTitle,
  skipInstall,
  packageName,
}: TemplateOptions) {
  logger.debug('Initializing new project');
  logger.log(banner);

  const projectDirectory = await setProjectDirectory(directory);

  const loader = getLoader({text: 'Downloading template'});
  const templateSourceDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rncli-init-template-'),
  );

  try {
    await PackageManager.init({
      preferYarn: !npm,
      silent: true,
      root: templateSourceDir,
    });

    const yarnVersion = getYarnVersionIfAvailable();

    if (!npm && yarnVersion !== null) {
      if (semver.satisfies(yarnVersion, '>=3.0.0')) {
        const yarnrcYmlPathLocation = await findUp('.yarnrc.yml', {
          type: 'file',
        });

        if (yarnrcYmlPathLocation && fs.existsSync(yarnrcYmlPathLocation)) {
          const yarnYmlContent = parse(
            fs.readFileSync(yarnrcYmlPathLocation, 'utf8'),
          );

          if (
            !yarnYmlContent.nodeLinker ||
            yarnYmlContent.nodeLinker !== 'node-modules'
          ) {
            await overwriteYarnrcFile(yarnrcYmlPathLocation, yarnYmlContent);
          }

          addNodeLinker(templateSourceDir);
        } else {
          throw new CLIError(
            'Failed to found "yarnrc.yml". To create React Native app without "yarnrc.yml" file you need to use Yarn Classic.',
          );
        }
      } else if (semver.satisfies(yarnVersion, '>=2.0.0')) {
        const yarnrcYmlPathLocation = await findUp('.yarnrc.yml', {
          type: 'file',
        });

        if (yarnrcYmlPathLocation && fs.existsSync(yarnrcYmlPathLocation)) {
          const yarnYmlContent = parse(
            fs.readFileSync(yarnrcYmlPathLocation, 'utf8'),
          );

          if (
            !yarnYmlContent.nodeLinker ||
            yarnYmlContent.nodeLinker !== 'node-modules'
          ) {
            await overwriteYarnrcFile(yarnrcYmlPathLocation, yarnYmlContent);
          }

          addNodeLinker(templateSourceDir);
        } else {
          logger.info(
            `You're using Yarn at ${yarnVersion} version but you don't have ".yarnrc.yml" with "nodeLinker: node-modules". To create project without ".yarnrc.yml" file you need to use Yarn Classic.`,
          );

          const {value} = await prompts({
            type: 'confirm',
            name: 'value',
            message:
              'Do you want to add ".yarnrc.yml" file with "nodeLinker: node-modules" to your project?',
            initial: true,
          });

          if (value) {
            addNodeLinker(projectDirectory);
            addNodeLinker(templateSourceDir);
          } else {
            throw new CLIError('Aborting process.');
          }
        }
      }
    }

    loader.start();

    await installTemplatePackage(templateUri, templateSourceDir, npm);

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
        npm,
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
  npm,
  loader,
  root,
}: {
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
    await installPods(loader);
  }

  loader.succeed();
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
    directory,
    projectTitle: options.title,
    skipInstall: options.skipInstall,
    packageName: options.packageName,
  });
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

  await createProject(projectName, directoryName, version, options);

  const projectFolder = path.join(root, directoryName);
  printRunInstructions(projectFolder, projectName);
});
