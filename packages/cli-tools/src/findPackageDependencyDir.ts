/**
 * Source vendored from:
 * https://github.com/microsoft/rnx-kit/blob/f37adca5161eba66fc27de25d48f72973fff9e8e/packages/tools-node/src/package.ts#L213-L234
 */
import findUp from 'find-up';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Pick the value for each `key` property from `obj` and return each one in a new object.
 * If `names` are given, use them in the new object, instead of `keys`.
 *
 * If any `key` was not found or its value was `undefined`, nothing will be picked for that key.
 *
 * @param obj Object to pick from
 * @param keys Keys to pick
 * @param names Optional names to use in the output object
 * @returns A new object containing a each `name` property and the picked value, or `undefined` if no keys were picked.
 */
export function pickValues<T>(
  obj: T,
  keys: (keyof T)[],
  names?: string[],
): Record<string, unknown> | undefined {
  const finalNames = names ?? keys;
  const results: Record<string, unknown> = {};

  let pickedValue = false;
  for (let index = 0; index < keys.length; ++index) {
    const value = obj[keys[index]];
    if (typeof value !== 'undefined') {
      results[finalNames[index].toString()] = value;
      pickedValue = true;
    }
  }

  return pickedValue ? results : undefined;
}

/**
 * Components of a package reference.
 */
export type PackageRef = {
  scope?: string;
  name: string;
};

/**
 * Options which control how package dependecies are located.
 */
export type FindPackageDependencyOptions = {
  /**
   * Optional starting directory for the search. Defaults to `process.cwd()`.
   */
  startDir?: string;

  /**
   * Optional flag controlling whether symlinks can be found. Defaults to `true`.
   * When `false`, and the package dependency directory is a symlink, it will not
   * be found.
   */
  allowSymlinks?: boolean;

  /**
   * Optional flag controlling whether to resolve symlinks. Defaults to `false`.
   * Note that this flag has no effect if `allowSymlinks` is `false`.
   */
  resolveSymlinks?: boolean;
};

/**
 * Find the package dependency's directory, starting from the given directory
 * and moving outward, through all parent directories.
 *
 * Package dependencies exist under 'node_modules/[`scope`]/[`name`]'.
 *
 * @param ref Package dependency reference
 * @param options Options which control the search
 * @returns Path to the package dependency's directory, or `undefined` if not found.
 */
export function findPackageDependencyDir(
  ref: string | PackageRef,
  options?: FindPackageDependencyOptions,
): string | undefined {
  const pkgName =
    typeof ref === 'string' ? ref : path.join(ref.scope ?? '', ref.name);
  const packageDir = findUp.sync(path.join('node_modules', pkgName), {
    ...pickValues(
      options ?? {},
      ['startDir', 'allowSymlinks'],
      ['cwd', 'allowSymlinks'],
    ),
    type: 'directory',
  });
  if (!packageDir || !options?.resolveSymlinks) {
    return packageDir;
  }

  return fs.lstatSync(packageDir).isSymbolicLink()
    ? path.resolve(path.dirname(packageDir), fs.readlinkSync(packageDir))
    : packageDir;
}
