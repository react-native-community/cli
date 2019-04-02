// @flow
import {execFileSync} from 'child_process';
import path from 'path';
import * as PackageManager from '../../tools/PackageManager';
import logger from '../../tools/logger';
import copyProjectTemplateAndReplace from '../../tools/generator/copyProjectTemplateAndReplace';

export type TemplateConfig = {
  placeholderName: string,
  templateDir: string,
  postInitScript?: string,
};

export function installTemplatePackage(templateName: string, npm?: boolean) {
  logger.debug(`Installing template from ${templateName}`);
  PackageManager.install([templateName], {preferYarn: !npm});
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

  copyProjectTemplateAndReplace(templatePath, process.cwd(), templateName);
}

export function executePostInitScript(
  templateName: string,
  postInitScript: string,
) {
  const scriptPath = path.resolve('node_modules', templateName, postInitScript);

  logger.debug(`Executing post init script located ${scriptPath}`);

  execFileSync(scriptPath, {stdio: 'inherit'});
}
