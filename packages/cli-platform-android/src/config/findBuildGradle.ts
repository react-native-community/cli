import fs from 'fs';
import path from 'path';

export function findBuildGradle(sourceDir: string) {
  const buildGradlePaths = [
    'app/build.gradle',
    'app/build.gradle.kts',
    'build.gradle',
    'build.gradle.kts',
  ];
  return (
    buildGradlePaths
      .map((bgp) => path.join(sourceDir, bgp))
      .find((bgp) => fs.existsSync(bgp)) ?? null
  );
}
