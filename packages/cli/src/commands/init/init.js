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
  fetchTemplate,
  getTemplateConfig,
  copyTemplate,
  executePostInstallScript,
} from './template';
import {changePlaceholderInTemplate} from './editTemplate';
import PackageManager from '../../tools/PackageManager';
import {supportProtocols} from './protocols';

type Options = {|
  template?: string,
|};

function createFromExternalTemplate(projectName: string, templateName: string) {
  logger.info('Initializing new project from extrenal template');

  const {packageDir, packageName} = supportProtocols(templateName);

  fetchTemplate(packageDir);
  const templateConfig = getTemplateConfig(packageName);
  copyTemplate(packageName, templateConfig.templateDir);
  changePlaceholderInTemplate(packageName, templateConfig.placeholderName);

  new PackageManager({}).installAll();

  if (templateConfig.postInitScript) {
    executePostInstallScript(templateName, templateConfig.postInitScript);
  }
}

function createFromReactNativeTemplate(projectName: string, version: string) {
  logger.info('Initializing new project');

  if (version !== 'latest' && !semver.satisfies(version, '0.60.0')) {
    throw new Error(
      'Cannot use React Native CLI to initialize project with version less than 0.60.0',
    );
  }

  const TEMPLATE_NAME = 'react-native';

  const {packageDir} = supportProtocols(version, `${TEMPLATE_NAME}@${version}`);

  fetchTemplate(packageDir);
  const templateConfig = getTemplateConfig(TEMPLATE_NAME);
  copyTemplate(TEMPLATE_NAME, templateConfig.templateDir);
  changePlaceholderInTemplate(projectName, templateConfig.placeholderName);

  new PackageManager({}).installAll();

  if (templateConfig.postInitScript) {
    executePostInstallScript(TEMPLATE_NAME, templateConfig.postInitScript);
  }
}

function createProject(projectName: string, options: Options, version: string) {
  fs.mkdirSync(projectName);
  process.chdir(projectName);

  if (options.template) {
    return createFromExternalTemplate(projectName, options.template);
  }

  return createFromReactNativeTemplate(projectName, version);
}

export default function initialize(
  [projectName]: Array<string>,
  context: ContextT,
  options: Options,
) {
  try {
    validateProjectName(projectName);

    /**
     * Commander is stripping `version` from options automatically.
     * We have to use `minimist` to take that directly from `process.argv`
     */
    const version: string = minimist(process.argv).version || 'latest';

    if (fs.existsSync(projectName)) {
      throw new DirectoryAlreadyExistsError(projectName);
    }

    createProject(projectName, options, version);

    printRunInstructions(process.cwd(), projectName);
  } catch (e) {
    logger.error(e.message);
    fs.removeSync(projectName);
  }
}
