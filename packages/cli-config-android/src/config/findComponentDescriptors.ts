import fs from 'fs';
import path from 'path';
import glob from 'tinyglobby';
import {extractComponentDescriptors} from './extractComponentDescriptors';
import {unixifyPaths} from '@react-native-community/cli-tools';

export function findComponentDescriptors(packageRoot: string) {
  let jsSrcsDir = null;
  try {
    const packageJson = fs.readFileSync(
      path.join(packageRoot, 'package.json'),
      'utf8',
    );
    jsSrcsDir = JSON.parse(packageJson).codegenConfig.jsSrcsDir;
  } catch (error) {
    // no jsSrcsDir, continue with default glob pattern
  }
  const globPattern = jsSrcsDir
    ? `${jsSrcsDir}/**/*{.js,.jsx,.ts,.tsx}`
    : '**/*{.js,.jsx,.ts,.tsx}';
  const files = glob.globSync(globPattern, {
    cwd: unixifyPaths(packageRoot),
    expandDirectories: false,
    ignore: ['**/node_modules/**'],
  });
  const codegenComponent = files
    .map((filePath) =>
      fs.readFileSync(path.join(packageRoot, filePath), 'utf8'),
    )
    .map(extractComponentDescriptors)
    .filter(Boolean);

  // Filter out duplicates as it happens that libraries contain multiple outputs due to package publishing.
  // TODO: consider using "codegenConfig" to avoid this.
  return Array.from(new Set(codegenComponent as string[]));
}
