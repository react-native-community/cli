// @flow
import fs from 'fs-extra';
import path from 'path';
import PackageManager from '../../tools/PackageManager';
import walk from '../../tools/walk';

function getExternalTemplate(templateName: string) {
  const packageManager = new PackageManager({});
  packageManager.install([templateName]);
  fs.copySync(path.join('node_modules', templateName), process.cwd());
}

function getReactNativeTemplate(version?: string) {
  const packageManager = new PackageManager({});

  packageManager.install([`react-native@${version || 'latest'}`]);

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

function replaceNameInUTF8File(filePath: string, projectName: string) {
  const content = fs
    .readFileSync(filePath, 'utf8')
    .replace(/ProjectName/g, projectName)
    .replace(/projectname/g, projectName.toLowerCase());

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
  walk(process.cwd())
    .reverse()
    .forEach((filePath: string) => {
      if (isNonBinaryFile(filePath)) {
        replaceNameInUTF8File(filePath, projectName);
      }
      if (shouldRenameFile(filePath, 'ProjectName')) {
        renameFile(filePath, 'ProjectName', projectName);
      }
      if (shouldRenameFile(filePath, 'projectname')) {
        renameFile(filePath, 'projectname', projectName.toLowerCase());
      }
    });
}

export function prepareExternalTemplate(
  projectName: string,
  templateName: string,
) {
  getExternalTemplate(templateName);
  changeNameInTemplate(projectName);
}

export function prepareReactNativeTemplate(
  projectName: string,
  version?: string,
) {
  getReactNativeTemplate(version);
  changeNameInTemplate(projectName);
}
