import {Config} from '@react-native-community/cli-types';
import {logger, CLIError} from '@react-native-community/cli-tools';
import fs from 'fs';
import chalk from 'chalk';

export function getAndroidProject(config: Config) {
  const androidProject = config.project.android;

  if (!androidProject) {
    throw new CLIError(`
      Android project not found. Are you sure this is a React Native project?
      If your Android files are located in a non-standard location (e.g. not inside 'android' folder), consider setting
      \`project.android.sourceDir\` option to point to a new location.
    `);
  }
  return androidProject;
}

/**
 * Util function to discover the package name from either the Manifest file or the build.gradle file.
 * @param manifestPath The path to the AndroidManifest.xml
 * @param buildGradlePath The path to the build.gradle[.kts] file.
 */
function discoverPackageName(
  manifestPath: string | null,
  buildGradlePath: string | null,
) {
  if (manifestPath) {
    const androidManifest = fs.readFileSync(manifestPath, 'utf8');
    const packageNameFromManifest = parsePackageNameFromAndroidManifestFile(
      androidManifest,
    );
    // We got the package from the AndroidManifest.xml
    if (packageNameFromManifest) {
      return packageNameFromManifest;
    }
  }

  if (buildGradlePath) {
    // We didn't get the package from the AndroidManifest.xml,
    // so we'll try to get it from the build.gradle[.kts] file
    // via the namespace field.
    const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    const namespace = parseNamespaceFromBuildGradleFile(buildGradle);
    if (namespace) {
      return namespace;
    }
  }

  throw new CLIError(
    `Failed to build the app: No package name found. 
    We couldn't parse the namespace from neither your build.gradle[.kts] file at ${chalk.underline.dim(
      `${buildGradlePath}`,
    )} 
    nor your package in the AndroidManifest at ${chalk.underline.dim(
      `${manifestPath}`,
    )}
    `,
  );
}

/**
 * Get the package name/namespace of the running React Native app
 * @param manifestPath The path to the AndroidManifest.xml
 * @param buildGradlePath The path to the build.gradle[.kts] file.
 */
export function getPackageName(
  manifestPath: string | null,
  buildGradlePath: string | null,
) {
  let packageName = discoverPackageName(manifestPath, buildGradlePath);
  if (!validatePackageName(packageName)) {
    logger.warn(
      `Invalid application's package name "${chalk.bgRed(
        packageName,
      )}" in either 'AndroidManifest.xml' or 'build.gradle'. Read guidelines for setting the package name here: ${chalk.underline.dim(
        'https://developer.android.com/studio/build/application-id',
      )}`,
    );
  }
  return packageName;
}

export function parsePackageNameFromAndroidManifestFile(
  androidManifest: string,
) {
  const matchArray = androidManifest.match(/package="(.+?)"/);
  if (matchArray && matchArray.length > 0) {
    return matchArray[1];
  } else {
    return null;
  }
}

export function parseNamespaceFromBuildGradleFile(buildGradle: string) {
  // search for namespace = inside the build.gradle file via regex
  const matchArray = buildGradle.match(/namespace\s*[=]*\s*["'](.+?)["']/);
  if (matchArray && matchArray.length > 0) {
    return matchArray[1];
  } else {
    return null;
  }
}

// Validates that the package name is correct
export function validatePackageName(packageName: string) {
  return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(packageName);
}

// Search for applicationId at defaultConfig object
export function parseApplicationIdFromBuildGradleFile(buildGradlePath: string) {
  if (!buildGradlePath) {
    return null;
  }
  const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

  const matchArray = buildGradle.match(/defaultConfig\s*{([\s\S]*?)}/);

  if (matchArray && matchArray.length > 0) {
    const appIdMatchArray = matchArray[1].match(
      /applicationId\s*[=]*\s*["'](.+?)["']/,
    );
    return appIdMatchArray?.[1] ?? '';
  } else {
    return null;
  }
}
