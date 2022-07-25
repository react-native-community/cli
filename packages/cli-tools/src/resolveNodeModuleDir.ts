import {findPackageDependencyDir} from './findPackageDependencyDir';
import {CLIError} from './errors';

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
  if (packageDependencyDirectory === undefined) {
    throw new CLIError(
      `Node module directory for package ${packageName} was not found`,
    );
  } else {
    return packageDependencyDirectory;
  }
}
