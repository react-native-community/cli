import {Config} from '@react-native-community/cli-types';
import {execSync} from 'child_process';
import {logger, CLIError} from '@react-native-community/cli-tools';
import fs from 'fs';
import path from 'path';
import os from 'os';
import transformer from 'hermes-profile-transformer';
import {findSourcemap, generateSourcemap} from './sourcemapUtils';
import {getAndroidProject} from '@react-native-community/cli-platform-android';
import {getMetroBundleOptions} from './metroBundleOptions';
/**
 * Get the last modified hermes profile
 * @param packageNameWithSuffix
 */
function getLatestFile(packageNameWithSuffix: string): string {
  try {
    const file =
      execSync(`adb shell run-as ${packageNameWithSuffix} ls cache/ -tp | grep -v /$ | grep -E '.cpuprofile' | head -1
        `);
    return file.toString().trim();
  } catch (e) {
    throw e;
  }
}

function execSyncWithLog(command: string) {
  logger.debug(`${command}`);
  return execSync(command);
}

/**
 * A wrapper that converts an object to JSON with 4 spaces for indentation.
 *
 * @param obj Any object that can be represented as JSON
 * @returns A JSON string
 */
function jsonStringify(obj: any) {
  return JSON.stringify(obj, undefined, 4);
}

/**
 * Pull and convert a Hermes tracing profile to Chrome tracing profile
 * @param ctx
 * @param dstPath
 * @param fileName
 * @param sourceMapPath
 * @param raw
 * @param generateSourceMap
 * @param appId
 * @param appIdSuffix
 */
export async function downloadProfile(
  ctx: Config,
  dstPath: string,
  filename?: string,
  sourcemapPath?: string,
  raw?: boolean,
  shouldGenerateSourcemap?: boolean,
  port: string = '8081',
  appId?: string,
  appIdSuffix?: string,
  host: string = 'localhost',
) {
  try {
    const androidProject = getAndroidProject(ctx);
    const packageNameWithSuffix = [
      appId || androidProject.packageName,
      appIdSuffix,
    ]
      .filter(Boolean)
      .join('.');

    // If file name is not specified, pull the latest file from device
    const file = filename || getLatestFile(packageNameWithSuffix);
    if (!file) {
      throw new CLIError(
        'There is no file in the cache/ directory. Did you record a profile from the developer menu?',
      );
    }

    logger.info(`File to be pulled: ${file}`);

    // If destination path is not specified, pull to the current directory
    dstPath = dstPath || ctx.root;

    logger.debug('Internal commands run to pull the file:');

    // If --raw, pull the hermes profile to dstPath
    if (raw) {
      execSyncWithLog(
        `adb shell run-as ${packageNameWithSuffix} cat cache/${file} > ${dstPath}/${file}`,
      );
      logger.success(`Successfully pulled the file to ${dstPath}/${file}`);
    }

    // Else: transform the profile to Chrome format and pull it to dstPath
    else {
      const osTmpDir = os.tmpdir();
      const tempFilePath = path.join(osTmpDir, file);

      execSyncWithLog(
        `adb shell run-as ${packageNameWithSuffix} cat cache/${file} > ${tempFilePath}`,
      );

      const bundleOptions = getMetroBundleOptions(tempFilePath, host);

      // If path to source map is not given
      if (!sourcemapPath) {
        // Get or generate the source map
        if (shouldGenerateSourcemap) {
          sourcemapPath = await generateSourcemap(port, bundleOptions);
        } else {
          sourcemapPath = await findSourcemap(ctx, port, bundleOptions);
        }

        // Run without source map
        if (!sourcemapPath) {
          logger.warn(
            'Cannot find source maps, running the transformer without it',
          );
          logger.info(
            'Instructions on how to get source maps: set `bundleInDebug: true` in your app/build.gradle file, inside the `project.ext.react` map.',
          );
        }
      }

      // Run transformer tool to convert from Hermes to Chrome format
      const events = await transformer(
        tempFilePath,
        sourcemapPath,
        'index.bundle',
      );

      const transformedFilePath = `${dstPath}/${path.basename(
        file,
        '.cpuprofile',
      )}-converted.json`;

      // Convert to JSON in chunks because JSON.stringify() will fail for large
      // arrays with the error "RangeError: Invalid string length"
      const out = events.map(jsonStringify).join(',');

      fs.writeFileSync(transformedFilePath, '[' + out + ']', 'utf-8');
      logger.success(
        `Successfully converted to Chrome tracing format and pulled the file to ${transformedFilePath}`,
      );
    }
  } catch (e) {
    throw e;
  }
}
