import {mkdirSync} from 'fs';
const StreamZip = require('node-stream-zip');

const unzip = async (source: string, destination: string) => {
  return new Promise((resolve, reject) => {
    const zip = new StreamZip({
      file: source,
      storeEntries: true,
    });

    mkdirSync(destination, {recursive: true});

    zip.on('ready', () => {
      zip.extract(null, destination, (err: Error | null) => {
        zip.close();

        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  });
};

export {unzip};
