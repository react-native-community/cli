import fs from 'fs';
import path from 'path';

export function findBuildGradle(sourceDir: string) {
  const buildGradlePath = path.join(sourceDir, 'build.gradle');
  const buildGradleKtsPath = path.join(sourceDir, 'build.gradle.kts');

  if (fs.existsSync(buildGradlePath)) {
    return buildGradlePath;
  } else if (fs.existsSync(buildGradleKtsPath)) {
    return buildGradleKtsPath;
  } else {
    return null;
  }
}
