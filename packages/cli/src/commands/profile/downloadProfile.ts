import {Config} from '@react-native-community/cli-types';
import {execSync} from 'child_process';
import {logger, CLIError} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {transformer} from './transformer';

/**
 * Get the last modified hermes profile
 */
function getLatestFile(packageName: string): string {
  try {
    const file = execSync(`adb shell run-as ${packageName} ls cache/ -tp | grep -v /$ | head -1
        `);

    return file.toString().trim();
  } catch (e) {
    throw new Error(e);
  }
}
/**
 * Get the package name of the running React Native app
 */
function getPackageName(config: Config) {
  const androidProject = config.project.android;

  if (!androidProject) {
    throw new CLIError(`
  Android project not found. Are you sure this is a React Native project?
  If your Android files are located in a non-standard location (e.g. not inside \'android\' folder), consider setting
  \`project.android.sourceDir\` option to point to a new location.
`);
  }
  const {manifestPath} = androidProject;
  const androidManifest = fs.readFileSync(manifestPath, 'utf8');

  let packageNameMatchArray = androidManifest.match(/package="(.+?)"/);
  if (!packageNameMatchArray || packageNameMatchArray.length === 0) {
    throw new CLIError(
      'Failed to build the app: No package name found. Found errors in /src/main/AndroidManifest.xml',
    );
  }

  let packageName = packageNameMatchArray[1];

  if (!validatePackageName(packageName)) {
    logger.warn(
      `Invalid application's package name "${chalk.bgRed(
        packageName,
      )}" in 'AndroidManifest.xml'. Read guidelines for setting the package name here: ${chalk.underline.dim(
        'https://developer.android.com/studio/build/application-id',
      )}`,
    );
  }
  return packageName;
}
/** Validates that the package name is correct
 *
 */

function validatePackageName(packageName: string) {
  return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName);
}

/**
 * Executes the commands to pull a hermes profile
 */
export async function downloadProfile(
  ctx: Config,
  dstPath: string,
  fileName?: string,
  sourceMapPath?: string,
  raw?: boolean,
) {
  try {
    const packageName = getPackageName(ctx);
    //if not specify fileName, pull the latest file
    const file = fileName || (await getLatestFile(packageName));
    if (!file) {
      logger.error(
        'There is no file in the cache/ directory. Did you record a profile from the developer menu?',
      );
      process.exit(1);
    }
    //if not specify destination path, pull to the current directory
    if (!dstPath) {
      dstPath = ctx.root;
    }
    logger.info(`File to be pulled: ${file}`);
    //if '--verbose' is enabled
    if (logger.isVerbose()) {
      logger.info('Internal commands run to pull the file: ');
      logger.debug(`adb shell run-as ${packageName} cp cache/${file} /sdcard`);
      logger.debug(`adb pull /sdcard/${file} ${dstPath}`);
    }
    //Copy the file from device's data to sdcard, then pull the file to a temp directory
    execSync(`adb shell run-as ${packageName} cp cache/${file} /sdcard`);

    //If --raw, pull the hermes profile to dstPath
    if (raw) {
      execSync(`adb pull /sdcard/${file} ${dstPath}`);
      logger.success(`Successfully pulled the file to ${dstPath}/${file}`);
    }
    //Else: transform the profile to Chrome format and pull it to dstPath
    else {
      const fileTmpDir = path.join(os.tmpdir(), file);
      execSync(`adb pull /sdcard/${file} ${fileTmpDir}`);

      //Generating the bundle and source map files
      if (!sourceMapPath) {
        execSync(
          `react-native bundle --entry-file index.js --bundle-output ${os.tmpdir()}/index.bundle --sourcemap-output ${os.tmpdir()}/index.map`,
        );

        //buildBundle(args, ctx, output);
      }
      sourceMapPath = sourceMapPath || `${os.tmpdir()}/index.map`;

      //Run transformer tool to convert from Hermes to Chrome format
      const events = await transformer(
        fileTmpDir,
        sourceMapPath,
        'index.bundle',
      );
      const transformedFilePath = `${dstPath}/${path.basename(
        file,
        '.cpuprofile',
      )}-converted.json`;
      fs.writeFileSync(
        transformedFilePath,
        JSON.stringify(events, undefined, 4),
        'utf-8',
      );
      logger.success(
        `Successfully converted to Chrome tracing format and pulled the file to ${transformedFilePath}`,
      );
    }
  } catch (e) {
    throw new Error(e.message);
  }
}
