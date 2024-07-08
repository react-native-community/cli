import fs from 'fs';
import glob from 'fast-glob';
import path from 'path';
import {unixifyPaths} from '@react-native-community/cli-tools';

export function getMainActivityFiles(
  folder: string,
  includePackage: boolean = true,
) {
  let patternArray = [];

  if (includePackage) {
    patternArray.push('*Module.java', '*Module.kt');
  } else {
    patternArray.push('*.java', '*.kt');
  }

  return glob.sync(`**/+(${patternArray.join('|')})`, {
    cwd: unixifyPaths(folder),
  });
}

export default function findModuleName(folder: string) {
  let files = getMainActivityFiles(folder);
  let packages = getModuleClassName(files, folder);

  if (!packages.length) {
    files = getMainActivityFiles(folder, false);
    packages = getModuleClassName(files, folder);
  }

  // @ts-ignore
  return packages.length ? packages[0][1] : null;
}

function getModuleClassName(files: string[], folder: string) {
  return files
    .map((filePath) => fs.readFileSync(path.join(folder, filePath), 'utf8'))
    .map(matchClassName)
    .filter((match) => match);
}

export function matchClassName(file: string) {
  const moduleMatch = file.match(
    /class\s+(\w+[^(\s]*)[\s\w():]*(\s+extends\s+|:)[\s\w():,]*[^{]*ReactContextBaseJavaModule/,
  );

  if (moduleMatch) {
    return moduleMatch;
  } else {
    return file.match(
      /class\s+(\w+[^(\s]*)[\s\w():]*(\s+extends\s+|:)[\s\w():,]*[^{]*Native\w+Spec/,
    );
  }
}
