import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as stream from 'stream';
import {pipeline} from 'stream/promises';
import {randomUUID} from 'crypto';

import {CLIError} from './errors';

async function unwrapFetchResult(response: Response) {
  const data = await response.text();

  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

/**
 * Downloads the given `url` to the OS's temp folder and
 * returns the path to it.
 */
const fetchToTemp = async (url: string): Promise<string> => {
  const result = await global.fetch(url);
  if (result.status >= 400) {
    throw new CLIError(`Fetch request failed with status ${result.status}`);
  }
  if (result.body === null) {
    throw new CLIError('Fetch request failed - empty body');
  }

  const fileName = path.basename(new URL(url).pathname) || 'download';
  const tmpFile = path.join(
    os.tmpdir(),
    `react-native-cli-${randomUUID()}-${fileName}`,
  );
  const body = stream.Readable.fromWeb(result.body);
  const dest = fs.createWriteStream(tmpFile, {flags: 'wx'});
  let created = false;
  dest.once('open', () => {
    created = true;
  });
  try {
    await pipeline(body, dest);
    return tmpFile;
  } catch (error) {
    if (created) {
      await fs.promises.unlink(tmpFile).catch(() => {});
    }
    throw error;
  }
};

const fetch = async (
  url: string | Request,
  options?: RequestInit,
): Promise<{status: number; data: any; headers: Headers}> => {
  const result = await global.fetch(url, options);
  const data = await unwrapFetchResult(result);

  if (result.status >= 400) {
    throw new CLIError(
      `Fetch request failed with status ${result.status}: ${data}.`,
    );
  }

  return {
    status: result.status,
    headers: result.headers,
    data,
  };
};

export {fetch, fetchToTemp};
