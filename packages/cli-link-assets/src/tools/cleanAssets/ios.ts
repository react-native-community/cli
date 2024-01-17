import {logger} from '@react-native-community/cli-tools';
import fs from 'fs-extra';
import path from 'path';
import xcode, {PBXFile} from 'xcode';
import createGroupWithMessage from '../helpers/xcode/createGroupWithMessage';
import getPlist from '../helpers/xcode/getPlist';
import writePlist from '../helpers/xcode/writePlist';
import {CleanAssets, IOSCleanAssetsOptions} from './types';

const cleanAssets: CleanAssets = (assetFiles, options) => {
  const {
    platformPath,
    ios_pbxprojFilePath: pbxprojFilePath,
    ios_addFont: addFont,
  } = options as IOSCleanAssetsOptions;

  const project = xcode.project(pbxprojFilePath).parseSync();
  const plist = getPlist(project, platformPath);

  if (!plist) {
    logger.error('Plist could not be found.');
    return;
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

  if (addFont) {
    const existingFonts = (plist.UIAppFonts as string[]) ?? [];
    const allFonts = existingFonts.filter(
      (file) => removedFiles.indexOf(file) === -1,
    );
    plist.UIAppFonts = Array.from(new Set(allFonts)); // use Set to dedupe w/existing
  }

  fs.writeFileSync(pbxprojFilePath, project.writeSync());

  writePlist(project, platformPath, plist);
};

export default cleanAssets;

// function cleanAssetsIOS(files, projectConfig, {addFont}) {
//   const project = xcode.project(projectConfig.pbxprojPath).parseSync();
//   const plist = getPlist(project, projectConfig.sourceDir);

//   createGroupWithMessage(project, 'Resources');

//   function removeResourceFile(f) {
//     return (f || [])
//       .map((asset) =>
//         project.removeResourceFile(
//           path.relative(projectConfig.sourceDir, asset),
//           {target: project.getFirstTarget().uuid},
//         ),
//       )
//       .filter((file) => file) // xcode returns false if file is already there
//       .map((file) => file.basename);
//   }

//   const removedFiles = removeResourceFile(files);

//   if (addFont) {
//     const existingFonts = plist.UIAppFonts || [];
//     const allFonts = existingFonts.filter(
//       (file) => removedFiles.indexOf(file) === -1,
//     );
//     plist.UIAppFonts = Array.from(new Set(allFonts)); // use Set to dedupe w/existing
//   }

//   fs.writeFileSync(projectConfig.pbxprojPath, project.writeSync());

//   writePlist(project, projectConfig.sourceDir, plist);
// }
