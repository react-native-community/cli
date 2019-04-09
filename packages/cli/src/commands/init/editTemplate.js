// @flow
import fs from 'fs-extra';
import path from 'path';
import walk from '../../tools/walk';
import {logger} from '@react-native-community/cli-tools';

function replaceNameInUTF8File(
  filePath: string,
  projectName: string,
  templateName: string,
) {
  logger.debug(`Replacing in ${filePath}`);

  const content = fs
    .readFileSync(filePath, 'utf8')
    .replace(new RegExp(templateName, 'g'), projectName)
    .replace(
      new RegExp(templateName.toLowerCase(), 'g'),
      projectName.toLowerCase(),
    );

  fs.writeFileSync(filePath, content, 'utf8');
}

function renameFile(filePath: string, oldName: string, newName: string) {
  const newFileName = path.join(
    path.dirname(filePath),
    path.basename(filePath).replace(new RegExp(oldName, 'g'), newName),
  );

  logger.debug(`Renaming ${filePath} -> file:${newFileName}`);

  fs.moveSync(filePath, newFileName);
}

function shouldRenameFile(filePath: string, nameToReplace: string) {
  return path.basename(filePath).includes(nameToReplace);
}

function shouldIgnoreFile(filePath: string) {
  return filePath.match(/node_modules|yarn.lock|package-lock.json/g);
}

const UNDERSCORED_DOTFILES = [
  'buckconfig',
  'eslintrc.js',
  'flowconfig',
  'gitattributes',
  'gitignore',
  'watchmanconfig',
];

function processDotfiles(filePath: string) {
  const dotfile = UNDERSCORED_DOTFILES.find(e => filePath.includes(`_${e}`));

  if (dotfile === undefined) {
    return;
  }

  renameFile(filePath, `_${dotfile}`, `.${dotfile}`);
}

export function changePlaceholderInTemplate(
  projectName: string,
  placeholderName: string,
) {
  logger.debug(`Changing ${placeholderName} for ${projectName} in template`);

  walk(process.cwd())
    .reverse()
    .forEach((filePath: string) => {
      if (shouldIgnoreFile(filePath)) {
        return;
      }
      if (!fs.statSync(filePath).isDirectory()) {
        replaceNameInUTF8File(filePath, projectName, placeholderName);
      }
      if (shouldRenameFile(filePath, placeholderName)) {
        renameFile(filePath, placeholderName, projectName);
      }
      if (shouldRenameFile(filePath, placeholderName.toLowerCase())) {
        renameFile(
          filePath,
          placeholderName.toLowerCase(),
          projectName.toLowerCase(),
        );
      }

      processDotfiles(filePath);
    });
}
