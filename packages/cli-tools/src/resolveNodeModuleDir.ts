import path from 'path';

/**
 * Finds a path inside `node_modules`
 */
export default function resolveNodeModuleDir(
  root: string,
  packageName: string,
): string {
  try {
    return path.dirname(
      require.resolve(path.join(packageName, 'package.json'), {
        paths: [root],
      }),
    );
  } catch (e) {
    //TODO: Remove this alternate method once Node figures out a better way of resolving the package root directory. See https://github.com/nodejs/loaders/issues/26
    return alternateResolveNodeModuleDir(root, packageName);
  }
}

export function alternateResolveNodeModuleDir(
  root: string,
  packageName: string,
) {
  const moduleMainFilePath = require.resolve(packageName, {paths: [root]});

  const moduleNameParts = packageName.split('/');

  let searchForPathSection;

  if (packageName.startsWith('@') && moduleNameParts.length > 1) {
    const [org, mod] = moduleNameParts;
    searchForPathSection = `node_modules${path.sep}${org}${path.sep}${mod}`;
  } else {
    const [mod] = moduleNameParts;
    searchForPathSection = `node_modules${path.sep}${mod}`;
  }

  const lastIndex = moduleMainFilePath.lastIndexOf(searchForPathSection);

  if (lastIndex === -1) {
    throw new Error(
      `Unable to resolve base directory of package ${packageName}. Searched inside the resolved main file path "${moduleMainFilePath}" using "${searchForPathSection}"`,
    );
  }

  return moduleMainFilePath.slice(0, lastIndex + searchForPathSection.length);
}
