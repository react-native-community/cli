import fs from 'fs';
import path from 'path';

export function findLibraryName(root: string, sourceDir: string) {
  const packageJsonPath = path.join(root, 'package.json');
  const buildGradlePath = path.join(sourceDir, 'build.gradle');
  const buildGradleKtsPath = path.join(sourceDir, 'build.gradle.kts');

  // We first check if there is a codegenConfig.name inside the package.json file.
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.codegenConfig?.name) {
      return packageJson.codegenConfig.name;
    }
  }

  // If not, we check if the library specified it in the build.gradle file.
  let match: RegExpMatchArray | null = null;
  if (fs.existsSync(buildGradlePath)) {
    const buildGradleContents = fs
      .readFileSync(buildGradlePath, 'utf-8')
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    match = buildGradleContents.match(/libraryName = ["'](.+)["']/);
  } else if (fs.existsSync(buildGradleKtsPath)) {
    const buildGradleContents = fs
      .readFileSync(buildGradleKtsPath, 'utf-8')
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    match = buildGradleContents.match(/libraryName\.set\(["'](.+)["']\)/);
  } else {
    return undefined;
  }

  if (match) {
    return match[1];
  } else {
    return undefined;
  }
}
