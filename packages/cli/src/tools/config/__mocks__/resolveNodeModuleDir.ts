const path = require('path');

export default function resolveNodeModuleDir(
  root: string,
  packageName: string,
): string {
  return path.join(root, 'node_modules', packageName);
}
