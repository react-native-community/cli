/**
 * @flow
 */

const path = require('path');

export default function resolveNodeModule(
  root: string,
  packageName: string,
): string {
  return path.join(root, 'node_modules', packageName);
}
