import execa from 'execa';
import path from 'path';
import {logger, CLIError} from '@react-native-community/cli-tools';
import * as PackageManager from '../../tools/packageManager';
import copyFiles from '../../tools/copyFiles';
import replacePathSepForRegex from '../../tools/replacePathSepForRegex';
import fs from 'fs';
import chalk from 'chalk';

export type TemplateConfig = {
  placeholderName: string;
  templateDir: string;
  postInitScript?: string;
  titlePlaceholder?: string;
};

export async function installTemplatePackage(
  templateName: string,
  root: string,
  npm?: boolean,
) {
  logger.debug(`Installing template from ${templateName}`);

  await PackageManager.init({
    preferYarn: !npm,
    silent: true,
    root,
  });

  return PackageManager.install([templateName], {
    preferYarn: !npm,
    silent: true,
    root,
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
    'template.config.js',
  );

  logger.debug(`Getting config from ${configFilePath}`);
  if (!fs.existsSync(configFilePath)) {
    throw new CLIError(
      `Couldn't find the "${configFilePath} file inside "${templateName}" template. Please make sure the template is valid.
      Read more: ${chalk.underline.dim(
        'https://github.com/react-native-community/cli/blob/master/docs/init.md#creating-custom-template',
      )}`,
    );
  }
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
