import path from 'path';
import {logger} from '@react-native-community/cli-tools';
import walk from '../../tools/walk';

// We need `graceful-fs` behavior around async file renames on Win32.
// `gracefulify` does not support patching `fs.promises`. Use `fs-extra`, which
// exposes its own promise-based interface over `graceful-fs`.
import fs from 'fs-extra';

interface PlaceholderConfig {
  projectName: string;
  placeholderName: string;
  placeholderTitle?: string;
  projectTitle?: string;
}

/**
  TODO: This is a default placeholder for title in react-native template.
  We should get rid of this once custom templates adapt `placeholderTitle` in their configurations.
*/
const DEFAULT_TITLE_PLACEHOLDER = 'Hello App Display Name';

async function replaceNameInUTF8File(
  filePath: string,
  projectName: string,
  templateName: string,
) {
  logger.debug(`Replacing in ${filePath}`);
  const isPackageJson = path.basename(filePath) === 'package.json';
  const fileContent = await fs.readFile(filePath, 'utf8');
  const replacedFileContent = fileContent
    .replace(new RegExp(templateName, 'g'), projectName)
    .replace(
      new RegExp(templateName.toLowerCase(), 'g'),
      projectName.toLowerCase(),
    );

  if (fileContent !== replacedFileContent) {
    await fs.writeFile(filePath, replacedFileContent, 'utf8');
  }

  if (isPackageJson) {
    await fs.writeFile(
      filePath,
      fileContent.replace(templateName, projectName.toLowerCase()),
      'utf8',
    );
  }
}

async function renameFile(filePath: string, oldName: string, newName: string) {
  const newFileName = path.join(
    path.dirname(filePath),
    path.basename(filePath).replace(new RegExp(oldName, 'g'), newName),
  );

  logger.debug(`Renaming ${filePath} -> file:${newFileName}`);

  await fs.rename(filePath, newFileName);
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
  'prettierrc.js',
  'watchmanconfig',
  'editorconfig',
];

async function processDotfiles(filePath: string) {
  const dotfile = UNDERSCORED_DOTFILES.find((e) => filePath.includes(`_${e}`));

  if (dotfile === undefined) {
    return;
  }

  await renameFile(filePath, `_${dotfile}`, `.${dotfile}`);
}

export async function changePlaceholderInTemplate({
  projectName,
  placeholderName,
  placeholderTitle = DEFAULT_TITLE_PLACEHOLDER,
  projectTitle = projectName,
}: PlaceholderConfig) {
  logger.debug(`Changing ${placeholderName} for ${projectName} in template`);

  for (const filePath of walk(process.cwd()).reverse()) {
    if (shouldIgnoreFile(filePath)) {
      continue;
    }
    if (!(await fs.stat(filePath)).isDirectory()) {
      await replaceNameInUTF8File(filePath, projectName, placeholderName);
      await replaceNameInUTF8File(filePath, projectTitle, placeholderTitle);
    }
    if (shouldRenameFile(filePath, placeholderName)) {
      await renameFile(filePath, placeholderName, projectName);
    }
    if (shouldRenameFile(filePath, placeholderName.toLowerCase())) {
      await renameFile(
        filePath,
        placeholderName.toLowerCase(),
        projectName.toLowerCase(),
      );
    }

    await processDotfiles(filePath);
  }
}
