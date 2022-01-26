import findUp from 'find-up';
import path from 'path';
import {CLIError} from './errors';

/**
 * Finds project root by looking for a closest `package.json`.
 */
export default function findProjectRoot(cwd = process.cwd()): string {
  const packageLocation = findUp.sync('package.json', {cwd});
  /**
   * It is possible that `package.json` doesn't exist
   * in the tree. In that case, we want to throw an error.
   *
   * When executing via `npx`, this will never happen as `npm`
   * requires that file to be present in order to run.
   */
  if (!packageLocation) {
    throw new CLIError(`
      We couldn't find a package.json in your project.
      Are you sure you are running it inside a React Native project?
    `);
  }

  return path.dirname(packageLocation);
}
