// @flow
import fs from 'fs-extra';
import path from 'path';
import walk from '../../tools/walk';

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

export function changePlaceholderInTemplate(
  projectName: string,
  placeholderName: string,
) {
  walk(process.cwd())
    .reverse()
    .forEach((filePath: string) => {
      if (filePath.includes('node_modules')) {
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
    });
}
