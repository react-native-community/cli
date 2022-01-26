import path from 'path';
import fs from 'fs';

/**
 * Returns an array of dependencies from project's package.json
 */
export default function findDependencies(root: string): Array<string> {
  let pjson;

  try {
    pjson = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'UTF-8'),
    );
  } catch (e) {
    return [];
  }

  const deps = [
    ...Object.keys(pjson.dependencies || {}),
    ...Object.keys(pjson.devDependencies || {}),
  ];

  return deps;
}
