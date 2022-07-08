import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

import nodeFetch, {
  RequestInit as FetchOptions,
  Response,
  Request,
  Headers,
} from 'node-fetch';
import {CLIError} from './errors';
import logger from './logger';

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
const fetchToTemp = (url: string): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      const fileName = path.basename(url);
      const tmpDir = path.join(os.tmpdir(), fileName);

      nodeFetch(url).then((result) => {
        if (result.status >= 400) {
          return reject(`Fetch request failed with status ${result.status}`);
        }

        const dest = fs.createWriteStream(tmpDir);
        result.body.pipe(dest);

        result.body.on('end', () => {
          resolve(tmpDir);
        });

        result.body.on('error', reject);
      });
    });
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

const fetch = async (
  url: string | Request,
  options?: FetchOptions,
): Promise<{status: number; data: any; headers: Headers}> => {
  const result = await nodeFetch(url, options);
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
