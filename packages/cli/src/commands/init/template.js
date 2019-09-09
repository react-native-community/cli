// @flow
import execa from 'execa';
import path from 'path';
import * as PackageManager from '../../tools/packageManager';
import {logger} from '@react-native-community/cli-tools';
// $FlowFixMe - converted to TS
import copyFiles from '../../tools/copyFiles';
// $FlowFixMe - converted to TS
import replacePathSepForRegex from '../../tools/replacePathSepForRegex';

export type TemplateConfig = {
  placeholderName: string,
  templateDir: string,
  postInitScript?: string,
  titlePlaceholder?: string,
};

export function installTemplatePackage(
  templateName: string,
  cwd: string,
  npm?: boolean,
) {
  logger.debug(`Installing template from ${templateName}`);
  return PackageManager.install([templateName], {
    preferYarn: !npm,
    silent: true,
    cwd,
  });
}

export function getTemplateConfig(
  templateName: string,
  templateSourceDir: string,
): TemplateConfig {
  const configFilePath = path.resolve(
    templateSourceDir,
    'node_modules',
    templateName,
    'template.config',
  );

  logger.debug(`Getting config from ${configFilePath}.js`);

  return require(configFilePath);
}

export async function copyTemplate(
  templateName: string,
  templateDir: string,
  templateSourceDir: string,
) {
  const templatePath = path.resolve(
    templateSourceDir,
    'node_modules',
    templateName,
    templateDir,
  );

  logger.debug(`Copying template from ${templatePath}`);
  let regexStr = path.resolve(templatePath, 'node_modules');
  await copyFiles(templatePath, process.cwd(), {
    exclude: [new RegExp(replacePathSepForRegex(regexStr))],
  });
}

export function executePostInitScript(
  templateName: string,
  postInitScript: string,
  templateSourceDir: string,
) {
  const scriptPath = path.resolve(
    templateSourceDir,
    'node_modules',
    templateName,
    postInitScript,
  );

  logger.debug(`Executing post init script located ${scriptPath}`);

  return execa(scriptPath, {stdio: 'inherit'});
}
