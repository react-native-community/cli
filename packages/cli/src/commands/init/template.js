// @flow
import {execFileSync} from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import PackageManager from '../../tools/PackageManager';

export type TemplateConfig = {
  placeholderName: string,
  templateDir: string,
  postInitScript?: string,
};

export function installTemplatePackage(templateName: string) {
  new PackageManager({}).install([templateName]);
}

export function getTemplateConfig(templateName: string): TemplateConfig {
  return require(path.join('node_modules', templateName, 'template.config'));
}

export function copyTemplate(templateName: string, templateDir: string) {
  const templatePath = path.join('node_modules', templateName, templateDir);
  fs.copySync(templatePath, process.cwd());
}

export function executePostInstallScript(
  templateName: string,
  postInitScript: string,
) {
  execFileSync(
    path.join(process.cwd(), 'node_modules', templateName, postInitScript),
  );
}
