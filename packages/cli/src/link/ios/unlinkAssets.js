/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs-extra';
import path from 'path';
import xcode from 'xcode';
import { difference } from 'lodash';
import log from '../../util/logger';

import groupFilesByType from '../groupFilesByType';
import getPlist from './getPlist';
import writePlist from './writePlist';

/**
 * Unlinks assets from iOS project. Removes references for fonts from `Info.plist`
 * fonts provided by application and from `Resources` group
 */
module.exports = function unlinkAssetsIOS(files, projectConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const assets = groupFilesByType(files);
  const plist = getPlist(project, projectConfig.sourceDir);

  if (!plist) {
    log.error(
      'Could not locate "Info.plist" file. Check if your project has "INFOPLIST_FILE" set properly'
    );
    return;
  }

  if (!project.pbxGroupByName('Resources')) {
    log.error(
      'Group "Resources" does not exist in your Xcode project. There is nothing to unlink.'
    );
    return;
  }

  const removeResourceFiles = (f = []) =>
    (f || [])
      .map(asset =>
        project.removeResourceFile(
          path.relative(projectConfig.sourceDir, asset),
          { target: project.getFirstTarget().uuid }
        )
      )
      .map(file => file.basename);

  removeResourceFiles(assets.image);

  const fonts = removeResourceFiles(assets.font);

  plist.UIAppFonts = difference(plist.UIAppFonts || [], fonts);

  fs.writeFileSync(projectConfig.pbxprojPath, project.writeSync());

  writePlist(project, projectConfig.sourceDir, plist);
};
