import {logger} from '@react-native-community/cli-tools';
import fs from 'fs-extra';
import path from 'path';
import xcode, {PBXFile} from 'xcode';
import createGroupWithMessage from '../helpers/xcode/createGroupWithMessage';
import getPlist from '../helpers/xcode/getPlist';
import writePlist from '../helpers/xcode/writePlist';
import {CopyAssets, IOSCopyAssetsOptions} from './types';

/**
 * This function works in a similar manner to its Android version,
 * except it does not copy assets but creates Xcode Group references
 */
const copyAssets: CopyAssets = (assetFiles, options) => {
  const {platformPath, pbxprojFilePath, isFontAsset} =
    options as IOSCopyAssetsOptions;

  const project = xcode.project(pbxprojFilePath).parseSync();
  const plist = getPlist(project, platformPath);

  if (!plist) {
    logger.error('Plist could not be found.');
    return;
  }

  createGroupWithMessage(project, 'Resources');

  function addResourceFile(assets: string[]) {
    return assets
      .map(
        (asset) =>
          project.addResourceFile(path.relative(platformPath, asset), {
            target: project.getFirstTarget().uuid,
          }) as PBXFile,
      )
      .filter((file) => file) // xcode returns false if file is already there
      .map((file) => file.basename);
  }

  const addedFiles = addResourceFile(assetFiles);

  if (isFontAsset) {
    const existingFonts = (plist.UIAppFonts as string[]) ?? [];
    const allFonts = [...existingFonts, ...addedFiles];
    plist.UIAppFonts = Array.from(new Set(allFonts)); // use Set to dedupe w/existing
  }

  fs.writeFileSync(pbxprojFilePath, project.writeSync());

  writePlist(project, platformPath, plist);
};

export default copyAssets;
