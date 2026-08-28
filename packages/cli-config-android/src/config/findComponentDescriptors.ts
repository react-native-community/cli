import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
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
  const files = glob.sync(globPattern, {
    cwd: unixifyPaths(packageRoot),
    onlyFiles: true,
    ignore: ['**/node_modules/**'],
  });
  // Filter out duplicates as it happens that libraries contain multiple outputs due to package publishing.
  // TODO: consider using "codegenConfig" to avoid this.
  const descriptors = new Set<string>();
  for (const filePath of files) {
    const descriptor = extractComponentDescriptors(
      fs.readFileSync(path.join(packageRoot, filePath), 'utf8'),
    );
    if (descriptor) {
      descriptors.add(descriptor);
    }
  }
  return Array.from(descriptors);
}
