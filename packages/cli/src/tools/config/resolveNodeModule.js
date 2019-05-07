/**
 * @flow
 */
import path from 'path';

/**
 * Finds a path inside `node_modules`
 */
export default function resolveNodeModule(
  root: string,
  packageName: string,
): string {
  return path.dirname(
    // $FlowIssue: Wrong `require.resolve` type definition
    require.resolve(path.join(packageName, 'package.json'), {
      paths: [root],
    }),
  );
}
