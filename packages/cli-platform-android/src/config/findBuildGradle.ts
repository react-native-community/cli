import fs from 'fs';
import path from 'path';

export function findBuildGradle(sourceDir: string, isLibrary: boolean) {
  const buildGradlePath = path.join(
    sourceDir,
    isLibrary ? 'build.gradle' : 'app/build.gradle',
  );
  const buildGradleKtsPath = path.join(
    sourceDir,
    isLibrary ? 'build.gradle.kts' : 'app/build.gradle.kts',
  );

  if (fs.existsSync(buildGradlePath)) {
    return buildGradlePath;
  } else if (fs.existsSync(buildGradleKtsPath)) {
    return buildGradleKtsPath;
  } else {
    return null;
  }
}
