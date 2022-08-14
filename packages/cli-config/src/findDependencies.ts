import path from 'path';
import fs from 'fs';
import glob from 'glob';
import findRoot from 'find-root';

/**
 * Returns an array of dependencies from workspaces's package.json
 */
function findWorkspacesDependencies(from: string): Array<string> {
  // find workspaces root if any
  let root: string | undefined;
  try {
    root = findRoot(from, (dir) => {
      const pjsonPath = path.join(dir, 'package.json');
      return (
        fs.existsSync(pjsonPath) &&
        typeof require(pjsonPath).workspaces !== 'undefined'
      );
    });
  } catch (e) {
    // noop.
  }

  // workspaces root is not defined
  if (typeof root === 'undefined') {
    return [];
  }

  const rootPjson: {
    workspaces: Array<string> | {packages: Array<string>};
  } = require(path.join(root, 'package.json'));
  let dependencies: Array<string> = [];
  const workspaces = Array.isArray(rootPjson.workspaces)
    ? rootPjson.workspaces
    : rootPjson.workspaces.packages;
  workspaces.forEach((workspaceName) => {
    const packages = glob.sync(path.join(root!, workspaceName));
    packages.forEach((pkg) => {
      try {
        const pjson = JSON.parse(
          fs.readFileSync(path.join(pkg, 'package.json'), 'utf8'),
        );
        dependencies = dependencies.concat(
          ...Object.keys(pjson.dependencies || {}),
          ...Object.keys(pjson.devDependencies || {}),
        );
      } catch (e) {
        // noop.
      }
    });
  });

  return dependencies;
}

/**
 * Returns an array of dependencies from project's package.json
 */
export default function findDependencies(root: string): Array<string> {
  let pjson;

  try {
    pjson = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
    );
  } catch (e) {
    return [];
  }

  const deps = [
    ...Object.keys(pjson.dependencies || {}),
    ...Object.keys(pjson.devDependencies || {}),
    ...findWorkspacesDependencies(root),
  ];

  return deps;
}
