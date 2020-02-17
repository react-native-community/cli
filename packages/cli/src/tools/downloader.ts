import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

import fetch from 'node-fetch';

/**
 * Downloads the contents of the given `url`
 * into the temp folder of the OS.
 */
const downloader = (url: string): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      const fileName = path.basename(url);
      const tmpDir = path.join(os.tmpdir(), fileName);

      fetch(url).then(res => {
        const dest = fs.createWriteStream(tmpDir);
        res.body.pipe(dest);

        res.body.on('end', () => {
          resolve(tmpDir);
        });

        res.body.on('error', reject);
      });
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export {downloader};
