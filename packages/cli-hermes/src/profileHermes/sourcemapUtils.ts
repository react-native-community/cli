import {Config} from '@react-native-community/cli-types';
import {logger, CLIError} from '@react-native-community/cli-tools';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {SourceMap} from 'hermes-profile-transformer';
import ip from 'ip';
import nodeFetch from 'node-fetch';

function getTempFilePath(filename: string) {
  return path.join(os.tmpdir(), filename);
}

function writeJsonSync(targetPath: string, data: any) {
  let json;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    logger.error(
      `Failed to serialize data to json before writing to ${targetPath}\n`,
      e,
    );
  }

  try {
    fs.writeFileSync(targetPath, json, 'utf-8');
  } catch (e) {
    logger.error(`Failed to write json to ${targetPath}\n`, e);
  }
}

async function getSourcemapFromServer(): Promise<SourceMap> {
  logger.debug('Getting source maps from Metro packager server\n');
  const DEBUG_SERVER_PORT = '8081';
  const IP_ADDRESS = ip.address();
  const PLATFORM = 'android';

  const requestURL = `http://${IP_ADDRESS}:${DEBUG_SERVER_PORT}/index.map?platform=${PLATFORM}&dev=true`;
  const result = await nodeFetch(requestURL);
  if (result.status >= 400) {
    logger.error('Cannot get source map from running metro server\n');
    throw new CLIError(`Fetch request failed with status ${result.status}.`);
  }
  const data = await result.json();
  return data as SourceMap;
}

/**
 * Generate a sourcemap by fetching it from a running metro server
 */
export async function generateSourcemap(): Promise<string> {
  // fetch the source map to a temp directory
  const sourceMapPath = getTempFilePath('index.map');
  const sourceMapResult = await getSourcemapFromServer();

  if (sourceMapResult) {
    if (logger.isVerbose()) {
      logger.debug('Using source maps from Metro packager server\n');
    }
    writeJsonSync(sourceMapPath, sourceMapResult);
    logger.info(
      `Successfully generated the source map and stored it in ${sourceMapPath}\n`,
    );
  } else {
    logger.error('Cannot generate source maps from Metro packager server\n`');
  }

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
      logger.debug(`Getting the source map from ${generateSourcemap}\n`);
    }
    return Promise.resolve(generatedBuildPath);
  } else if (fs.existsSync(intermediateBuildPath)) {
    if (logger.isVerbose()) {
      logger.debug(`Getting the source map from ${intermediateBuildPath}\n`);
    }
    return Promise.resolve(intermediateBuildPath);
  } else {
    const sourcemapResult = await getSourcemapFromServer();
    if (logger.isVerbose()) {
      logger.debug('Using source maps from Metro packager server\n');
    }
    const tempPath = getTempFilePath('index.map');
    writeJsonSync(tempPath, sourcemapResult);

    return tempPath;
  }
}
