// @flow

import {execFile} from 'child_process';
import {promisify} from 'util';
import path from 'path';
import * as PackageManager from '../../tools/packageManager';
import logger from '../../tools/logger';
import copyFiles from '../../tools/copyFiles';

export type TemplateConfig = {
  placeholderName: string,
  templateDir: string,
  postInitScript?: string,
};

export function installTemplatePackage(templateName: string, npm?: boolean) {
  logger.debug(`Installing template from ${templateName}`);
  return PackageManager.install([templateName], {
    preferYarn: !npm,
    silent: true,
  });
}

export function getTemplateConfig(templateName: string): TemplateConfig {
  const configFilePath = path.resolve(
    'node_modules',
    templateName,
    'template.config',
  );

  logger.debug(`Getting config from ${configFilePath}.js`);

  return require(configFilePath);
}

export function copyTemplate(templateName: string, templateDir: string) {
  const templatePath = path.resolve('node_modules', templateName, templateDir);

  logger.debug(`Copying template from ${templatePath}`);

  copyFiles(templatePath, process.cwd());
}

export function executePostInitScript(
  templateName: string,
  postInitScript: string,
) {
  const scriptPath = path.resolve('node_modules', templateName, postInitScript);

  logger.debug(`Executing post init script located ${scriptPath}`);

  return promisify(execFile)(scriptPath, {stdio: 'inherit'});
}
