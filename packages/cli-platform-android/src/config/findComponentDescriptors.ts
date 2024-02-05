import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import {extractComponentDescriptors} from './extractComponentDescriptors';
import {unixifyPaths} from '@react-native-community/cli-tools';

export function findComponentDescriptors(packageRoot: string) {
  const files = glob.sync('**/+(*.js|*.jsx|*.ts|*.tsx)', {
    cwd: unixifyPaths(packageRoot),
    onlyFiles: true,
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
