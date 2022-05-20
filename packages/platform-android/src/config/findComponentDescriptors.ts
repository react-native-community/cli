import fs from 'fs';
import path from 'path';
import glob from 'glob';
import {extractComponentDescriptors} from './extractComponentDescriptors';

export function findComponentDescriptors(packageRoot: string) {
  const files = glob.sync('**/+(*.js|*.jsx|*.ts|*.tsx)', {
    cwd: packageRoot,
    nodir: true,
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
