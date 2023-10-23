import {DependencyMap} from '@react-native-community/cli-types';
import {findDependencyPath} from '@react-native-community/cli-tools';
import path from 'path';
import fs from 'fs';

/**
 * Returns an array of dependencies from project's package.json
 */
export default function findDependencies(root: string): DependencyMap {
  const dependencies: DependencyMap = new Map();

  const checkDependency = (dependencyPath: string) => {
    let pjson: {[key: string]: any};

    const packageJsonPath = path.join(dependencyPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    pjson = JSON.parse(
      fs.readFileSync(path.join(dependencyPath, 'package.json'), 'utf8'),
    );

    if (dependencies.has(pjson.name)) {
      return;
    }

    dependencies.set(pjson.name, {
      version: pjson.version,
      peerDependencies: pjson.peerDependencies || {},
      path: dependencyPath,
    });

    for (const dependency in {
      ...pjson.dependencies,
      ...pjson.devDependencies,
    }) {
      const depPath = findDependencyPath(dependency, root, dependencyPath);
      if (depPath) {
        checkDependency(depPath);
      }
    }
  };

  checkDependency(root);

  return dependencies;
}
