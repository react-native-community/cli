// @flow
import fs from 'fs-extra';
import minimist from 'minimist';
import semver from 'semver';
import type {ContextT} from '../../tools/types.flow';
import {validateProjectName} from './validate';
import DirectoryAlreadyExistsError from './errors/DirectoryAlreadyExistsError';
import printRunInstructions from './printRunInstructions';
import logger from '../../tools/logger';
import {
  installTemplatePackage,
  getTemplateConfig,
  copyTemplate,
  executePostInitScript,
} from './template';
import {changePlaceholderInTemplate} from './editTemplate';
import * as PackageManager from '../../tools/PackageManager';
import {processTemplateName} from './templateName';

type Options = {|
  template?: string,
  npm?: boolean,
|};

function adjustNameIfUrl(name) {
  // We use package manager to infer the name of the template module for us.
  // That's why we get it from temporary package.json, where the name is the
  // first and only dependency (hence 0).
  if (name.match(/https?:/)) {
    name = Object.keys(
      JSON.parse(fs.readFileSync('./package.json', 'utf8')).dependencies,
    )[0];
  }
  return name;
}

async function createFromExternalTemplate(
  projectName: string,
  templateName: string,
  npm?: boolean,
) {
  logger.info('Initializing new project from external template');

  let {uri, name} = await processTemplateName(templateName);

  installTemplatePackage(uri, npm);
  name = adjustNameIfUrl(name);
  const templateConfig = getTemplateConfig(name);
  copyTemplate(name, templateConfig.templateDir);
  changePlaceholderInTemplate(projectName, templateConfig.placeholderName);

  if (templateConfig.postInitScript) {
    executePostInitScript(name, templateConfig.postInitScript);
  }

  PackageManager.installAll({preferYarn: !npm});
}

async function createFromReactNativeTemplate(
  projectName: string,
  version: string,
  npm?: boolean,
) {
  logger.info('Initializing new project');

  if (semver.valid(version) && !semver.satisfies(version, '0.60.0')) {
    throw new Error(
      'Cannot use React Native CLI to initialize project with version less than 0.60.0',
    );
  }

  const TEMPLATE_NAME = 'react-native';

  const {uri} = await processTemplateName(`${TEMPLATE_NAME}@${version}`);

  installTemplatePackage(uri, npm);
  const templateConfig = getTemplateConfig(TEMPLATE_NAME);
  copyTemplate(TEMPLATE_NAME, templateConfig.templateDir);
  changePlaceholderInTemplate(projectName, templateConfig.placeholderName);

  if (templateConfig.postInitScript) {
    executePostInitScript(TEMPLATE_NAME, templateConfig.postInitScript);
  }

  PackageManager.installAll({preferYarn: !npm});
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

export default async function initialize(
  [projectName]: Array<string>,
  context: ContextT,
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
}
