import {createReadStream} from 'fs';
import * as unzipper from 'unzipper';

/**
 * Unzips the contents of `source` into the `destination`
 * using streams to deal with large files.
 */
const unzip = async (source: string, destination: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    createReadStream(source)
      .pipe(unzipper.Extract({path: destination}))
      .on('close', resolve)
      .on('error', reject);
  });
};

export {unzip};
