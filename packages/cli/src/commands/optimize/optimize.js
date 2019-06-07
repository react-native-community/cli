/**
 * @flow
 */

const fs = require('fs').promises;
const path = require('path');
import sharp from 'sharp';
import type {ConfigT} from 'types';
import optimizeCommandLineArgs from './optimizeCommandLineArgs';
import {logger} from '@react-native-community/cli-tools';

function isImage(filePath: string) {
  const regex = /\.(png|jpg|jpeg)/;
  return filePath.toLowerCase().match(regex);
}

async function optimize(args: Array<string>, ctx: ConfigT) {
  logger.log('Optimizing assets...');
  const rootPathForImages = path.join(ctx.root, 'src');
  const images = await getAllImageAssets(rootPathForImages);
  for (const image of images) {
    const buffer = await sharp(image).toBuffer();
    const metadata = await sharp(buffer).metadata();
    const newName = createOutputFilename(image);

    const {mTimeMS: lastModified, ino: inode} = fs.statSync(image);
    if (metadata.format === 'jpeg') {
      sharp(image)
        .jpeg({quality: 75})
        .toFile(newName);
    } else {
      const outputFile = await sharp(image)
        .png({quality: 75})
        .toFile(newName);
    }
  }
}

/**
 * Get all image assets in react native project
 */
const getAllImageAssets = async (dir, fileList = []) => {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = await fs.stat(filepath);

    if (stat.isDirectory()) {
      fileList = await getAllImageAssets(filepath, fileList);
    } else {
      if (isImage(filepath)) {
        fileList.push(filepath);
      }
    }
  }

  return fileList;
};

const createOutputFilename = image => {
  const imagePath = image.split('/');
  const filename = imagePath.pop();
  const [base, extension] = filename.split('.');
  const output = base + '-output.' + extension;
  return imagePath.join('/') + '/' + output;
};

export default {
  name: 'optimize',
  description: 'Optimize images',
  func: optimize,
  options: optimizeCommandLineArgs,
};
