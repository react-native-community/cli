/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import path from 'path';
import xcode from 'xcode';
import {difference} from 'lodash';
import log from '../../tools/src/logger';

import groupFilesByType from '../../tools/src/groupFilesByType';
import getPlist from './getPlist';
import writePlist from './writePlist';
import {logger} from '@react-native-community/cli-tools';

/**
 * Unlinks assets from iOS project. Removes references for fonts from `Info.plist`
 * fonts provided by application and from `Resources` group
 */
export default function unlinkAssetsIOS(files, projectConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const assets = groupFilesByType(files);
  const plist = getPlist(project, projectConfig.sourceDir);

  if (!plist) {
    log.error(
      'Could not locate "Info.plist" file. Check if your project has "INFOPLIST_FILE" set properly',
    );
    return;
  }

  if (!project.pbxGroupByName('Resources')) {
    log.error(
      'Group "Resources" does not exist in your Xcode project. There is nothing to unlink.',
    );
    return;
  }

  const removeResourceFiles = (f = []) =>
    (f || [])
      .map(asset => {
        logger.debug(`Unlinking asset ${asset}`);
        return project.removeResourceFile(
          path.relative(projectConfig.sourceDir, asset),
          {target: project.getFirstTarget().uuid},
        );
      })
      .map(file => file.basename);

  removeResourceFiles(assets.image);

  const fonts = removeResourceFiles(assets.font);

  plist.UIAppFonts = difference(plist.UIAppFonts || [], fonts);

  fs.writeFileSync(projectConfig.pbxprojPath, project.writeSync());

  writePlist(project, projectConfig.sourceDir, plist);
}
