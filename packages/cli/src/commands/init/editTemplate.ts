import path from 'path';
import {CLIError, logger} from '@react-native-community/cli-tools';
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
  packageName?: string;
}

/**
  TODO: This is a default placeholder for title in react-native template.
  We should get rid of this once custom templates adapt `placeholderTitle` in their configurations.
*/
const DEFAULT_TITLE_PLACEHOLDER = 'Hello App Display Name';

export function validatePackageName(packageName: string) {
  const packageNameParts = packageName.split('.');
  const packageNameRegex = /^([a-zA-Z]([a-zA-Z0-9_])*\.)+[a-zA-Z]([a-zA-Z0-9_])*$/u;

  if (packageNameParts.length < 2) {
    throw `The package name ${packageName} is invalid. It should contain at least two segments, e.g. com.app`;
  }

  if (!packageNameRegex.test(packageName)) {
    throw `The ${packageName} package name is not valid. It can contain only alphanumeric characters and dots.`;
  }
}

async function replaceNameInUTF8File(
  filePath: string,
  projectName: string,
  templateName: string,
) {
  logger.debug(`Replacing in ${filePath}`);
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

function isIosFile(filePath: string) {
  return filePath.includes('ios');
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
  'bundle',
  'ruby-version',
  'node-version',
  'xcode.env',
];

async function processDotfiles(filePath: string) {
  const dotfile = UNDERSCORED_DOTFILES.find((e) => filePath.includes(`_${e}`));

  if (dotfile === undefined) {
    return;
  }

  await renameFile(filePath, `_${dotfile}`, `.${dotfile}`);
}

function getPackageNameDetails(packageName: string) {
  const cleanPackageName = packageName.replace(/[^\p{L}\p{N}.]+/gu, '');
  const packageNameArray = cleanPackageName.split('.');
  const [prefix, ...segments] = packageNameArray;
  const startsWithCom = prefix === 'com';

  return {
    cleanPackageName,
    packageNameArray,
    prefix,
    segments,
    startsWithCom,
  };
}

async function createAndroidPackagePaths(
  filePath: string,
  packageName: string,
) {
  const {startsWithCom, segments, packageNameArray} = getPackageNameDetails(
    packageName,
  );
  const pathFolders = filePath.split('/').slice(-2);
  if (pathFolders[0] === 'java' && pathFolders[1] === 'com') {
    const segmentsList = startsWithCom ? segments : packageNameArray;

    if (segmentsList.length > 1) {
      const initialDir = process.cwd();
      process.chdir(filePath);

      try {
        await fs.rename(
          `${filePath}/${segmentsList.join('.')}`,
          `${filePath}/${segmentsList[segmentsList.length - 1]}`,
        );

        for (const segment of segmentsList) {
          fs.mkdirSync(segment);
          process.chdir(segment);
        }

        await fs.rename(
          `${filePath}/${segmentsList[segmentsList.length - 1]}`,
          process.cwd(),
        );
      } catch {
        throw 'Failed to create correct paths for Android.';
      }

      process.chdir(initialDir);
    }
  }
}

export async function replacePlaceholderWithPackageName({
  projectName,
  placeholderName,
  placeholderTitle,
  packageName,
}: Omit<Required<PlaceholderConfig>, 'projectTitle'>) {
  validatePackageName(packageName);

  const {cleanPackageName, segments, startsWithCom} = getPackageNameDetails(
    packageName,
  );

  for (const filePath of walk(process.cwd()).reverse()) {
    if (shouldIgnoreFile(filePath)) {
      continue;
    }

    const iosFile = isIosFile(filePath);

    if (!(await fs.stat(filePath)).isDirectory()) {
      let newName = startsWithCom
        ? cleanPackageName
        : `com.${cleanPackageName}`;

      if (iosFile) {
        newName = projectName;
      }

      //replace bundleID for iOS
      await replaceNameInUTF8File(
        filePath,
        `PRODUCT_BUNDLE_IDENTIFIER = "${
          startsWithCom ? cleanPackageName : `com.${cleanPackageName}`
        }"`,
        'PRODUCT_BUNDLE_IDENTIFIER = "(.*)"',
      );

      if (filePath.includes('app.json')) {
        await replaceNameInUTF8File(filePath, projectName, placeholderName);
      } else {
        // replace main component name for Android package
        await replaceNameInUTF8File(
          filePath,
          `return "${projectName}"`,
          `return "${placeholderName}"`,
        );
        await replaceNameInUTF8File(
          filePath,
          `<string name="app_name">${projectName}</string>`,
          `<string name="app_name">${placeholderTitle}</string>`,
        );

        await replaceNameInUTF8File(
          filePath,
          newName,
          `com.${placeholderName}`,
        );
        await replaceNameInUTF8File(filePath, newName, placeholderName);
        await replaceNameInUTF8File(filePath, newName, placeholderTitle);
      }
    }

    let fileName = startsWithCom ? segments.join('.') : cleanPackageName;

    if (shouldRenameFile(filePath, placeholderName)) {
      if (iosFile) {
        fileName = projectName;
      }

      await renameFile(filePath, placeholderName, fileName);
    } else if (shouldRenameFile(filePath, placeholderName.toLowerCase())) {
      await renameFile(
        filePath,
        placeholderName.toLowerCase(),
        fileName.toLowerCase(),
      );
    }
    try {
      await createAndroidPackagePaths(filePath, packageName);
    } catch (error) {
      throw new CLIError('Failed to create correct paths for Android.');
    }

    await processDotfiles(filePath);
  }
}

export async function changePlaceholderInTemplate({
  projectName,
  placeholderName,
  placeholderTitle = DEFAULT_TITLE_PLACEHOLDER,
  projectTitle = projectName,
  packageName,
}: PlaceholderConfig) {
  logger.debug(`Changing ${placeholderName} for ${projectName} in template`);

  if (packageName) {
    try {
      await replacePlaceholderWithPackageName({
        projectName,
        placeholderName,
        placeholderTitle,
        packageName,
      });
    } catch (error) {
      throw new CLIError((error as Error).message);
    }
  } else {
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
      } else if (shouldRenameFile(filePath, placeholderName.toLowerCase())) {
        await renameFile(
          filePath,
          placeholderName.toLowerCase(),
          projectName.toLowerCase(),
        );
      }

      await processDotfiles(filePath);
    }
  }
}
