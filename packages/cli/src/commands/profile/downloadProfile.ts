import {Config} from '@react-native-community/cli-types';
import {execSync} from 'child_process';
import {logger, CLIError} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import axios, {AxiosResponse} from 'axios';
import ip from 'ip';
import {transformer} from 'hermes-profile-transformer';

/**
 * Get the last modified hermes profile
 * @param packageName
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
 * @param config
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

/**
 * Validates that the package name is correct
 * @param packageName
 */
function validatePackageName(packageName: string) {
  return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName);
}

async function getSourcemapFromServer(): Promise<AxiosResponse<SourceMap>> {
  const DEBUG_SERVER_PORT = '8081';
  const IP_ADDRESS = ip.address();
  const PLATFORM = 'android';
  const requestURL = `http://${IP_ADDRESS}:${DEBUG_SERVER_PORT}/index.map?platform=${PLATFORM}&dev=true`;
  return (await axios.get(requestURL)) as AxiosResponse<SourceMap>;
}

/**
 * Find or generate source map
 * @param ctx
 * @param generateSourceMap
 */
async function getSourcemapPath(
  ctx: Config,
  generateSourceMap?: boolean,
): Promise<string> {
  const osTmpDir = os.tmpdir();
  //If '--generate-sourcemap, generate the bundle and source map files and store them in os.tmpDir()
  if (generateSourceMap) {
    console.log('generate new source map');
    //Store the file in os.tmpDir()
    const sourceMapPath = path.join(osTmpDir, 'index.map');

    const sourceMapResult = await getSourcemapFromServer();
    if (sourceMapResult) {
      console.log('Request from server: done finding the source map');
      fs.writeFileSync(
        `${sourceMapPath}`,
        JSON.stringify(sourceMapResult.data),
        'utf-8',
      );
      console.log('Request from server: done writing the source map');
    } else {
      console.log('begin to build bundle');
      execSync(
        `react-native bundle --entry-file index.js --bundle-output ${path.join(
          osTmpDir,
          'index.bundle',
        )} --sourcemap-output ${sourceMapPath}`,
      );
    }
    logger.info(
      `Successfully generated the source map and store it in ${sourceMapPath}`,
    );
    return `${sourceMapPath}`;
  }

  //Find the sourcemap if it exists
  else {
    console.log('find the existing source map');
    //Find from local machine
    //QUESTION: why is my source map path different from Jani's
    //(android/app/build/generated/sourcemaps/react/debug/index.android.bundle.map)
    const sourceMapDir =
      path.join(
        ctx.root,
        'android',
        'app',
        'build',
        'intermediates', //'generated',
        'sourcemaps',
        'react',
        'debug',
        'index.android.bundle.packager.map',
      ) ||
      path.join(
        ctx.root,
        'android',
        'app',
        'build',
        'generated',
        'sourcemaps',
        'react',
        'debug',
        'index.android.bundle.map',
      );
    console.log(sourceMapDir);
    if (fs.existsSync(sourceMapDir)) {
      console.log('get the sourcemap if it exists from local machine');
      return sourceMapDir;
    } else {
      //Request from server
      const sourceMapResult = await getSourcemapFromServer();
      fs.writeFileSync(
        `${path.join(osTmpDir, 'index.map')}`,
        JSON.stringify(sourceMapResult.data),
        'utf-8',
      );
      return `${path.join(osTmpDir, 'index.map')}`;
    }
  }
}

/**
 * Pull and convert a Hermes tracing profile to Chrome tracing profile
 * @param ctx
 * @param dstPath
 * @param fileName
 * @param sourceMapPath
 * @param raw
 * @param generateSourceMap
 */
export async function downloadProfile(
  ctx: Config,
  dstPath: string,
  fileName?: string,
  sourceMapPath?: string,
  raw?: boolean,
  generateSourceMap?: boolean,
) {
  try {
    //console.log('start the profile command');
    const packageName = getPackageName(ctx);
    //if not specify fileName, pull the latest file
    const file = fileName || (await getLatestFile(packageName));
    if (!file) {
      logger.error(
        'There is no file in the cache/ directory. Did you record a profile from the developer menu?',
      );
      process.exit(1);
    }
    logger.info(`File to be pulled: ${file}`);

    //if not specify destination path, pull to the current directory
    if (!dstPath) {
      dstPath = ctx.root;
    }
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
      const osTmpDir = os.tmpdir();
      const fileTmpDir = path.join(osTmpDir, file);
      execSync(`adb pull /sdcard/${file} ${fileTmpDir}`);

      //If path to source map is not given
      if (!sourceMapPath) {
        //Get or generate the source map
        sourceMapPath = await getSourcemapPath(ctx, generateSourceMap);
        //Run without source map
        if (sourceMapPath && sourceMapPath.length === 0) {
          logger.warn(
            'Cannot generate or find bundle and source map, running the transformer without source map',
          );
          logger.info(
            'Instructions on how to get source map:\n Go to directory android/app/build.gradle \n Set bundleInDebug: true',
          );
        }
      }

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
