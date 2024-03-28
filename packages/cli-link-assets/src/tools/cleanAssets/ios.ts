import {CLIError} from '@react-native-community/cli-tools';
import fs from 'fs-extra';
import path from 'path';
import xcode, {PBXFile} from 'xcode';
import createGroupWithMessage from '../helpers/xcode/createGroupWithMessage';
import getPlist from '../helpers/xcode/getPlist';
import writePlist from '../helpers/xcode/writePlist';
import {CleanAssets, IOSCleanAssetsOptions} from './types';

const cleanAssetsIOS: CleanAssets = (assetFiles, options) => {
  const {platformPath, pbxprojFilePath, isFontAsset} =
    options as IOSCleanAssetsOptions;

  const project = xcode.project(pbxprojFilePath).parseSync();
  const plist = getPlist(project, platformPath);

  if (!plist) {
    throw new CLIError('Failed to find PList file.');
  }

  createGroupWithMessage(project, 'Resources');

  function removeResourceFile(files: string[]) {
    return (files ?? [])
      .map(
        (asset) =>
          project.removeResourceFile(path.relative(platformPath, asset), {
            target: project.getFirstTarget().uuid,
          }) as PBXFile,
      )
      .filter((file) => file) // xcode returns false if file is already there
      .map((file) => file.basename);
  }

  const removedFiles = removeResourceFile(assetFiles);

  if (isFontAsset) {
    const existingFonts = (plist.UIAppFonts as string[]) ?? [];
    const allFonts = existingFonts.filter(
      (file) => removedFiles.indexOf(file) === -1,
    );
    plist.UIAppFonts = Array.from(new Set(allFonts)); // use Set to dedupe w/existing
  }

  try {
    fs.writeFileSync(pbxprojFilePath, project.writeSync());
  } catch (e) {
    throw new CLIError(
      `Failed to update "${pbxprojFilePath}" file.`,
      e as Error,
    );
  }

  writePlist(project, platformPath, plist);
};

export default cleanAssetsIOS;
