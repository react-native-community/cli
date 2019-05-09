// @flow
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import execa from 'execa';
import Ora from 'ora';
import minimist from 'minimist';
import semver from 'semver';
import inquirer from 'inquirer';
import commandExists from 'command-exists';
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
import {CLIError} from '@react-native-community/cli-tools/build/errors';

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

async function createFromTemplate({
  projectName,
  templateName,
  version,
  npm,
}: {
  projectName: string,
  templateName: string,
  version?: string,
  npm?: boolean,
}) {
  logger.debug('Initializing new project');
  logger.log(banner);
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

    await installDependencies({npm, loader});
  } catch (e) {
    loader.fail();
    throw new Error(e);
  } finally {
    fs.removeSync(templateSourceDir);
  }
}

async function installPods(loader: typeof Ora) {
  process.chdir('ios');

  const hasPods = await fs.pathExists('Podfile');

  if (!hasPods) {
    return;
  }

  try {
    await commandExists('pod');
  } catch (err) {
    loader.succeed();

    const {shouldInstallCocoaPods} = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldInstallCocoaPods',
        message: 'CocoaPods is not installed, do you want to install it?',
      },
    ]);

    if (shouldInstallCocoaPods) {
      try {
        // First attempt to install `cocoapods`
        await execa('gem', ['install', 'cocoapods'], {
          stdio: 'pipe',
        });
      } catch (err) {
        try {
          // If that doesn't work then try with sudo
          await execa('sudo', ['gem', 'install', 'cocoapods'], {
            stdio: 'pipe',
          });
        } catch (err) {
          throw new CLIError(
            'Error occurred while trying to install CocoaPods, please run this command again.',
            err,
          );
        }
      }

      loader.start('Installing pods');
    }
  }

  try {
    await execa('pod', ['install'], {
      stdio: 'pipe',
    });
  } catch (err) {
    throw new CLIError(
      'Failed to run "pod install", please try to run it manually.',
      err,
    );
  }
}

async function installDependencies({
  npm,
  loader,
}: {
  npm?: boolean,
  loader: typeof Ora,
}) {
  loader.start('Installing all required dependencies');

  await PackageManager.installAll({
    preferYarn: !npm,
    silent: true,
  });

  if (process.platform === 'darwin') {
    await installPods(loader);

    process.chdir('..');
  }

  loader.succeed();
}

function createProject(projectName: string, options: Options, version: string) {
  fs.mkdirSync(projectName);
  process.chdir(projectName);

  if (options.template) {
    return createFromTemplate({
      projectName,
      templateName: options.template,
      npm: options.npm,
    });
  }

  return createFromTemplate({
    projectName,
    templateName: 'react-native',
    version,
    npm: options.npm,
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

  if (fs.existsSync(projectName)) {
    throw new DirectoryAlreadyExistsError(projectName);
  }

  try {
    await createProject(projectName, options, version);

    await printRunInstructions(process.cwd(), projectName);
  } catch (e) {
    logger.error(e.message);
    fs.removeSync(projectName);
  }
});
