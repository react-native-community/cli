// @flow
import fs from 'fs-extra';
import path from 'path';
import PackageManager from '../../tools/PackageManager';
import walk from '../../tools/walk';
import {getReactNativeVersion, getTemplateName} from './utils';

function getExternalTemplate(templateName: string) {
  const packageManager = new PackageManager({});
  packageManager.install([templateName]);
  fs.copySync(
    path.join('node_modules', templateName, 'template'),
    process.cwd(),
  );
}

function getReactNativeTemplate(version: string) {
  const packageManager = new PackageManager({});

  packageManager.install([getReactNativeVersion(version)]);

  // We should use `path.dirname(require.resolve('react-native/template'));`, but for now
  // I use this version, because react-native doesn't exist in cli context
  const templatePath = path.join(
    process.cwd(),
    'node_modules',
    'react-native',
    'template',
  );

  fs.copySync(templatePath, process.cwd());
}

function replaceNameInUTF8File(
  filePath: string,
  projectName: string,
  templateName: string,
) {
  const content = fs
    .readFileSync(filePath, 'utf8')
    .replace(new RegExp(templateName, 'g'), projectName)
    .replace(
      new RegExp(templateName.toLowerCase(), 'g'),
      projectName.toLowerCase(),
    );

  fs.writeFileSync(filePath, content, 'utf8');
}

const BINARY_EXT = ['.png', '.jar'];

function isNonBinaryFile(filePath: string) {
  return (
    !BINARY_EXT.some(ext => filePath.includes(ext)) &&
    !fs.statSync(filePath).isDirectory()
  );
}

function renameFile(filePath: string, oldName: string, newName: string) {
  const newFileName = path.join(
    path.dirname(filePath),
    path.basename(filePath).replace(new RegExp(oldName, 'g'), newName),
  );

  fs.moveSync(filePath, newFileName);
}

function shouldRenameFile(filePath: string, nameToReplace: string) {
  return path.basename(filePath).includes(nameToReplace);
}

function changeNameInTemplate(projectName: string) {
  const templateName = getTemplateName();

  walk(process.cwd())
    .reverse()
    .forEach((filePath: string) => {
      if (isNonBinaryFile(filePath)) {
        replaceNameInUTF8File(filePath, projectName, templateName);
      }
      if (shouldRenameFile(filePath, templateName)) {
        renameFile(filePath, templateName, projectName);
      }
      if (shouldRenameFile(filePath, templateName.toLowerCase())) {
        renameFile(
          filePath,
          templateName.toLowerCase(),
          projectName.toLowerCase(),
        );
      }
    });
}

export function prepareExternalTemplate(
  projectName: string,
  templateName: string,
) {
  getExternalTemplate(templateName);
  new PackageManager({}).installAll();
  changeNameInTemplate(projectName);
}

export function prepareReactNativeTemplate(
  projectName: string,
  version: string,
) {
  getReactNativeTemplate(version);
  new PackageManager({}).installAll();
  changeNameInTemplate(projectName);
}
