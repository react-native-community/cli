// @flow
import fs from 'fs-extra';
import type {ContextT} from '../../tools/types.flow';
import {validateProjectName} from './validate';
import DirectoryAlreadyExistsError from './errors/DirectoryAlreadyExistsError';
import {
  prepareExternalTemplate,
  prepareReactNativeTemplate,
} from './prepareTemplate';
import printRunInstructions from './printRunInstructions';
import logger from '../../tools/logger';

type Options = {|
  template?: string,
  version?: string,
|};

type ExternalTemplateOptions = $Diff<Options, {template: string}> & {
  template: string,
};

function createFromExternalTemplate(
  projectName: string,
  options: ExternalTemplateOptions,
) {
  logger.info('Initializing new project from extrenal template');
  return prepareExternalTemplate(projectName, options.template);
}

function createFromReactNativeTemplate(
  projectName: string,
  rnVersion?: string,
) {
  logger.info('Initializing new project');
  return prepareReactNativeTemplate(projectName, rnVersion);
}

function createProject(projectName: string, options: Options) {
  fs.mkdirSync(projectName);
  process.chdir(projectName);

  if (options.template) {
    // $FlowFixMe: Flow goes stupid here
    return createFromExternalTemplate(projectName, options);
  }

  return createFromReactNativeTemplate(projectName, options.version);
}

export default function initialize(
  [projectName]: Array<string>,
  context: ContextT,
  options: Options,
) {
  try {
    validateProjectName(projectName);

    if (fs.existsSync(projectName)) {
      throw new DirectoryAlreadyExistsError(projectName);
    }

    createProject(projectName, options);

    printRunInstructions(process.cwd(), projectName);
  } catch (e) {
    logger.error(e.message);
    fs.removeSync(projectName);
  }
}
