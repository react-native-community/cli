import fs from 'fs';
import path from 'path';

/**
 * Find the build.gradle file for the given app name.
 * This helper is used to find build.gradle file in both apps and libraries.
 * For libraries, the appName is empty string.
 */
export function findBuildGradle(sourceDir: string, appName: string) {
  const buildGradlePath = path.join(
    sourceDir,
    path.join(appName, 'build.gradle'),
  );
  const buildGradleKtsPath = path.join(
    sourceDir,
    path.join(appName, 'build.gradle.kts'),
  );

  if (fs.existsSync(buildGradlePath)) {
    return buildGradlePath;
  } else if (fs.existsSync(buildGradleKtsPath)) {
    return buildGradleKtsPath;
  } else {
    return null;
  }
}
