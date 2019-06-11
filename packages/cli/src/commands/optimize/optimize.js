/**
 * @flow
 */

import fs from 'fs';
import type {ConfigT} from 'types';
import type {CommandLineArgs} from './optimizeCommandLineArgs';
import optimizeCommandLineArgs from './optimizeCommandLineArgs';
import inquirer from 'inquirer';
import * as AssetUtils from './AssetUtils';
import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';

async function optimize(_: Array<string>, ctx: ConfigT, args: CommandLineArgs) {
  const options = {
    ...(typeof args.save !== 'undefined' ? {save: args.save} : {}),
    ...(typeof args.quality !== 'undefined' ? {quality: args.quality} : {}),
    ...(typeof args.include !== 'undefined' ? {include: args.include} : {}),
    ...(typeof args.exclude !== 'undefined' ? {exclude: args.exclude} : {}),
  };
  const hasUnoptimizedAssets = await AssetUtils.hasUnoptimizedAssetsAsync(
    ctx.root,
    options,
  );
  if (!args.save && hasUnoptimizedAssets) {
    logger.warn('Running this command will overwrite the original assets.');
    const {saveOriginals} = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveOriginals',
        message: 'Do you want to save a backup of each file?',
      },
    ]);
    if (saveOriginals) {
      options.save = true;
    }
  }
  await optimizeAsync(ctx.root, options);
}

const optimizeAsync = async (projectDir, options = {}) => {
  logger.info('Optimizing assets...');
  const {
    readAssetJsonAsync,
    getAssetFilesAsync,
    optimizeImageAsync,
    calculateHash,
    createNewFilename,
    toReadableValue,
  } = AssetUtils;

  const {assetJson, assetInfo} = await readAssetJsonAsync(projectDir);
  // Keep track of which hash values in assets.json are no longer in use
  const outdated = new Set();
  for (const fileHash in assetInfo) {
    outdated.add(fileHash);
  }

  let totalSaved = 0;
  const {allImages, selectedImages} = await getAssetFilesAsync(
    projectDir,
    options,
  );
  const hashes = {};
  // Remove assets that have been deleted/modified from assets.json
  allImages.forEach(image => {
    const hash = calculateHash(image);
    if (assetInfo[hash]) {
      outdated.delete(hash);
    }
    hashes[image] = hash;
  });
  outdated.forEach(outdatedHash => {
    delete assetInfo[outdatedHash];
  });

  const images =
    options.include || options.exclude ? selectedImages : allImages;
  for (const image of images) {
    const hash = hashes[image];
    if (assetInfo[hash]) {
      continue;
    }
    const {size: prevSize} = fs.statSync(image);
    const newName = createNewFilename(image);
    await optimizeImageAsync(image, newName, options.quality);

    const {size: newSize} = fs.statSync(image);
    const amountSaved = prevSize - newSize;
    if (amountSaved < 0) {
      // Delete the optimized version and revert changes
      fs.renameSync(newName, image);
      assetInfo[hash] = true;
      logger.info(
        chalk.gray(
          `Compressed version of ${image} was larger than original. Using original instead.`,
        ),
      );
      continue;
    }
    // Recalculate hash since the image has changed
    const newHash = calculateHash(image);
    assetInfo[newHash] = true;

    if (options.save) {
      if (hash === newHash) {
        logger.info(
          chalk.gray(
            `Compressed asset ${image} is identical to the original. Using original instead.`,
          ),
        );
        fs.unlinkSync(newName);
      } else {
        logger.info(chalk.gray(`Saving original asset to ${newName}`));
        // Save the old hash to prevent reoptimizing
        assetInfo[hash] = true;
      }
    } else {
      // Delete the renamed original asset
      fs.unlinkSync(newName);
    }
    totalSaved += amountSaved;
    logger.info(`Saved ${toReadableValue(amountSaved)}`);
  }
  if (totalSaved === 0) {
    logger.info('No assets optimized. Everything is fully compressed!');
  } else {
    logger.info(
      `Finished compressing assets. ${chalk.green(
        toReadableValue(totalSaved),
      )} saved.`,
    );
  }
  assetJson.writeAsync(assetInfo);
};

export default {
  name: 'optimize',
  description: 'Optimize images',
  func: optimize,
  options: optimizeCommandLineArgs,
};
