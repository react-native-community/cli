import path from 'path';
import fs from 'fs-extra';

interface DependencyData {
  path: string;
  version: string;
  duplicates?: DependencyData[];
}

export function collectDependencies(root: string): Map<string, DependencyData> {
  const dependencies = new Map<string, DependencyData>();

  const checkDependency = (dependencyPath: string) => {
    const packageJsonPath = path.join(dependencyPath, 'package.json');
    const packageJson = require(packageJsonPath);

    if (dependencies.has(packageJson.name)) {
      const dependency = dependencies.get(packageJson.name) as DependencyData;

      if (
        dependencyPath !== dependency.path &&
        dependency.duplicates?.every(
          (duplicate) => duplicate.path !== dependencyPath,
        )
      ) {
        dependencies.set(packageJson.name, {
          ...dependency,
          duplicates: [
            ...dependency.duplicates,
            {path: dependencyPath, version: packageJson.version},
          ],
        });
      }

      return;
    }

    dependencies.set(packageJson.name, {
      path: dependencyPath,
      version: packageJson.version,
      duplicates: [],
    });

    for (const dependency in {
      ...packageJson.dependencies,
      ...(root === dependencyPath ? packageJson.devDependencies : {}),
    }) {
      const depPath = path.join(dependencyPath, 'node_modules', dependency);
      const rootPath = path.join(root, 'node_modules', dependency);
      if (fs.existsSync(depPath)) {
        checkDependency(depPath);
      } else if (fs.existsSync(rootPath)) {
        checkDependency(rootPath);
      }
    }
  };

  checkDependency(root);

  return dependencies;
}

export function dedupeDependencies(
  dependencies: Map<string, DependencyData>,
): Map<string, DependencyData> {
  const latestVersions = new Map();
  Array.from(dependencies).forEach(([packageName, packageInfo]) => {
    if (packageInfo.duplicates!.length > 0) {
      const allVersions = [
        {path: packageInfo.path, version: packageInfo.version},
        ...packageInfo.duplicates!,
      ];

      const findLatest = allVersions.reduce((highest, pkg) =>
        pkg.version.localeCompare(highest.version) === 1 ? pkg : highest,
      );

      latestVersions.set(packageName, findLatest);
    }
  });

  return latestVersions;
}
