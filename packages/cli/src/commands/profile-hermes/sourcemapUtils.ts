import {Config} from '@react-native-community/cli-types';
import {execSync} from 'child_process';
import {logger} from '@react-native-community/cli-tools';
import fs from 'fs';
import path from 'path';
import os from 'os';
import axios, {AxiosResponse} from 'axios';
import {SourceMap} from 'hermes-profile-transformer';
import ip from 'ip';

function getTempFilePath(filename: string) {
  return path.join(os.tmpdir(), filename);
}

function writeJsonSync(targetPath: string, data: any) {
  let json;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    logger.error(
      `Failed to serialize data to json before writing to ${targetPath}`,
      e,
    );
  }

  try {
    fs.writeFileSync(targetPath, json, 'utf-8');
  } catch (e) {
    logger.error(`Failed to write json to ${targetPath}`, e);
  }
}

// @TODO
// Remove AxiosResponse, return Promise<SourceMap> where SourceMap
// is imported from the hermes-profiler-transformer
async function getSourcemapFromServer(): Promise<AxiosResponse<SourceMap>> {
  const DEBUG_SERVER_PORT = '8081';
  const IP_ADDRESS = ip.address();
  const PLATFORM = 'android';
  const requestURL = `http://${IP_ADDRESS}:${DEBUG_SERVER_PORT}/index.map?platform=${PLATFORM}&dev=true`;

  // @TODO
  // Use node-fetch instead of axios
  // Check for return http status code, if > 400 it's an error and
  // we should return null instead of the source map string

  return (await axios.get(requestURL)) as AxiosResponse<SourceMap>;
}

/**
 * Generate a sourcemap either by fetching it from a running metro server
 * or by running react-native bundle with sourcemaps enables
 */
export async function generateSourcemap(): Promise<string> {
  // fetch the source map to a temp directory
  const sourceMapPath = getTempFilePath('index.map');
  const sourceMapResult = await getSourcemapFromServer();

  if (sourceMapResult) {
    if (logger.isVerbose()) {
      logger.debug('Using source maps from Metro packager server');
    }
    writeJsonSync(sourceMapPath, sourceMapResult.data);
  } else {
    if (logger.isVerbose()) {
      logger.debug('Generating source maps using `react-native bundle`');
    }
    execSync(
      `react-native bundle --entry-file index.js --bundle-output ${getTempFilePath(
        'index.bundle',
      )} --sourcemap-output ${sourceMapPath}`,
    );
  }

  logger.info(
    `Successfully generated the source map and stored it in ${sourceMapPath}`,
  );

  return sourceMapPath;
}

/**
 *
 * @param ctx
 */
export async function findSourcemap(ctx: Config): Promise<string> {
  const intermediateBuildPath = path.join(
    ctx.root,
    'android',
    'app',
    'build',
    'intermediates', //'generated',
    'sourcemaps',
    'react',
    'debug',
    'index.android.bundle.packager.map',
  );

  const generatedBuildPath = path.join(
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

  if (fs.existsSync(generatedBuildPath)) {
    if (logger.isVerbose()) {
      logger.debug(`Getting the source map from ${generateSourcemap}`);
    }
    return Promise.resolve(generatedBuildPath);
  } else if (fs.existsSync(intermediateBuildPath)) {
    if (logger.isVerbose()) {
      logger.debug(`Getting the source map from ${intermediateBuildPath}`);
    }
    return Promise.resolve(intermediateBuildPath);
  } else {
    const sourcemapResult = await getSourcemapFromServer();
    if (logger.isVerbose()) {
      logger.debug('Using source maps from Metro packager server');
    }
    const tempPath = getTempFilePath('index.map');
    writeJsonSync(tempPath, sourcemapResult.data);

    return tempPath;
  }
}
