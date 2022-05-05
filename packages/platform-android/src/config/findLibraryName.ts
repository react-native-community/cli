import fs from 'fs';
import path from 'path';

export function findLibraryName(sourceDir: string) {
  const buildGradlePath = path.join(sourceDir, 'build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    const buildGradleContents = fs.readFileSync(buildGradlePath, 'utf-8');
    const match = buildGradleContents.match(/libraryName = "(.+)"/);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}
