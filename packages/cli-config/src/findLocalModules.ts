import path from 'path';
import fs from 'fs';

const LOCAL_MODULES_DIR = 'local_modules';

/**
 * Returns an object containing local modules under `local_modules` folder.
 */
export default function findLocalModules(
  projectRoot: string,
): {
  [packageName: string]: {
    root: string;
  };
} {
  try {
    const root = path.join(projectRoot, LOCAL_MODULES_DIR);

    const localModules = fs
      .readdirSync(path.join(projectRoot, LOCAL_MODULES_DIR))
      .map((name) => {
        const status = fs.statSync(path.join(root, name));
        if (!status.isDirectory()) {
          return null;
        }

        const moduleRoot = path.join(root, name);
        const {name: moduleName} = JSON.parse(
          fs.readFileSync(path.join(moduleRoot, 'package.json'), 'utf8'),
        );

        return [moduleName, {root: moduleRoot}];
      })
      .filter(Boolean) as [string, {root: string}][];

    return Object.fromEntries(localModules);
  } catch (e) {
    return {};
  }
}
