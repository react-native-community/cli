import {findPackageDependencyDir} from './findPackageDependencyDir';

/**
 * Finds a path inside `node_modules`
 */
export default function resolveNodeModuleDir(
  root: string,
  packageName: string,
): string {
  const packageDependencyDirectory = findPackageDependencyDir(packageName, {
    startDir: root,
  });

  return packageDependencyDirectory ?? '';
}
