import path from 'path';
import fs from 'fs';

/**
 * Returns an array of dependencies from project's package.json
 */
export default function findDependencies(root: string): Array<string> {
  let pjson;

  try {
    const content = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
    pjson = JSON.parse(content);
  } catch (e) {
    return [];
  }

  const deps = new Set([
    ...Object.keys(pjson.dependencies || {}),
    ...Object.keys(pjson.peerDependencies || {}),
    ...Object.keys(pjson.devDependencies || {}),
  ]);

  return Array.from(deps);
}
