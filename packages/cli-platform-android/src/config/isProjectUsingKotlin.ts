import {getMainActivityFiles} from './findPackageClassName';

export default function isProjectUsingKotlin(sourceDir: string): boolean {
  const mainActivityFiles = getMainActivityFiles(sourceDir, false);

  return mainActivityFiles.some((file) => file.endsWith('.kt'));
}
