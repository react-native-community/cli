import fs from 'fs';
import path from 'path';
import glob from 'glob';

const CODEGEN_NATIVE_COMPONENT_REGEX = /codegenNativeComponent(<.*>)?\(\s+["'`](\w+)["'`]\s+\)/m;

export function findComponentNames(packageRoot: string) {
  const files = glob.sync('**/+(*.js|*.jsx|*.ts|*.tsx)', {cwd: packageRoot});
  const codegenComponent = files
    .map((filePath) =>
      fs.readFileSync(path.join(packageRoot, filePath), 'utf8'),
    )
    .map((contents) => contents.match(CODEGEN_NATIVE_COMPONENT_REGEX))
    .map((match) => (match ? match[2] : match))
    .filter(Boolean);

  return codegenComponent as string[];
}
