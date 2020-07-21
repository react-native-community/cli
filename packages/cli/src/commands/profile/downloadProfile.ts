// @ts-ignore untyped
import {Config} from '@react-native-community/cli-types';
import {execSync} from 'child_process';
//import {projectConfig} from '../../../../platform-android/src/config/index';
import {logger, CLIError} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import fs from 'fs';

//get the last modified hermes profile
function getLatestFile(packageName: string): string {
  try {
    const file = execSync(`adb shell run-as ${packageName} ls cache/ -tp | grep -v /$ | head -1
        `);
    //console.log(file.toString());
    return file.toString().trim();
    //return parsePackagename(packages.toString());
  } catch (e) {
    throw new Error(e);
  }
}
//get the package name of the running React Native app
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
// Validates that the package name is correct
function validatePackageName(packageName: string) {
  return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName);
}

/**
 * Executes the commands to pull a hermes profile
 * Commands:
 * adb shell run-as com.rnhermesapp cp cache/sampling-profiler-trace1502707982002849976.cpuprofile /sdcard/latest.cpuprofile
 * adb pull /sdcard/latest.cpuprofile
 */

//const packageName = projectConfig(".",{} )?.packageName; //TODO: get AndroidProjectConfig
export async function downloadProfile(
  ctx: Config,
  dstPath?: string,
  fileName?: string,
) {
  try {
    const packageName = getPackageName(ctx);

    // const projectConfigResult = projectConfig(ctx.root, {});
    // let packageName;
    // if (projectConfigResult !== null) {
    //   packageName = projectConfigResult.packageName;
    // } else {
    //   packageName = ''; //cannot get packageName since config is empty
    // }
    let file;
    if (fileName !== undefined) {
      file = fileName;
    } else {
      file = await getLatestFile(packageName);
    }
    logger.info(`File to be pulled: ${file}`);
    // console.log(`adb shell run-as ${packageName} ls`);
    // execSync(`adb shell run-as ${packageName} ls`);
    execSync(`adb shell run-as ${packageName} cp cache/${file} /sdcard`);

    //if not specify destination path, pull to the current directory
    if (dstPath === undefined) {
      //execSync(`adb pull /sdcard/${file} ${process.cwd()}`);
      execSync(`adb pull /sdcard/${file} ${ctx.root}`);
      console.log(
        'Successfully pulled the file to the current root working directory',
      );
    }
    //if specified destination path, pull to that directory
    else {
      execSync(`adb pull /sdcard/${file} ${dstPath}`);
      console.log(`Successfully pulled the file to ${dstPath}`);
    }
    //return '';
  } catch (e) {
    throw new Error(e.message);
  }
}
