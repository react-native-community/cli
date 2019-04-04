/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import path from 'path';
import xcode from 'xcode';
import createGroupWithMessage from './createGroupWithMessage';
import getPlist from './getPlist';
import writePlist from './writePlist';
import {logger, groupFilesByType} from '@react-native-community/cli-tools';

/**
 * This function works in a similar manner to its Android version,
 * except it does not copy fonts but creates Xcode Group references
 */
export default function linkAssetsIOS(files, projectConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const assets = groupFilesByType(files);
  const plist = getPlist(project, projectConfig.sourceDir);

  createGroupWithMessage(project, 'Resources');

  function addResourceFile(f) {
    return (f || [])
      .map(asset => {
        logger.debug(`Linking asset ${asset}`);
        return project.addResourceFile(
          path.relative(projectConfig.sourceDir, asset),
          {target: project.getFirstTarget().uuid},
        );
      })
      .filter(file => file) // xcode returns false if file is already there
      .map(file => file.basename);
  }

  addResourceFile(assets.image);

  const fonts = addResourceFile(assets.font);

  const existingFonts = plist.UIAppFonts || [];
  const allFonts = [...existingFonts, ...fonts];
  plist.UIAppFonts = Array.from(new Set(allFonts)); // use Set to dedupe w/existing

  fs.writeFileSync(projectConfig.pbxprojPath, project.writeSync());

  writePlist(project, projectConfig.sourceDir, plist);
}
