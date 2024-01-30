/**
 *
 * @param path string
 * @returns string
 *
 * This function converts Windows paths to Unix paths.
 */

export default function unixifyPaths(path: string): string {
  return path.replace(/^([a-zA-Z]+:|\.\/)/, '');
}
