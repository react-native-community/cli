/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import { camelCase as toCamelCase } from 'lodash';

import revokePatch from './patches/revokePatch';
import makeSettingsPatch from './patches/makeSettingsPatch';
import makeBuildPatch from './patches/makeBuildPatch';
import makeStringsPatch from './patches/makeStringsPatch';
import makeImportPatch from './patches/makeImportPatch';
import makePackagePatch from './patches/makePackagePatch';

module.exports = function unregisterNativeAndroidModule(
  name,
  androidConfig,
  projectConfig
) {
  const buildPatch = makeBuildPatch(name);
  const strings = fs.readFileSync(projectConfig.stringsPath, 'utf8');
  const params = {};

  strings.replace(
    /moduleConfig="true" name="(\w+)">(.*)</g,
    (_, param, value) => {
      params[param.slice(toCamelCase(name).length + 1)] = value;
    }
  );

  revokePatch(
    projectConfig.settingsGradlePath,
    makeSettingsPatch(name, androidConfig, projectConfig)
  );

  revokePatch(projectConfig.buildGradlePath, buildPatch);
  revokePatch(projectConfig.stringsPath, makeStringsPatch(params, name));

  revokePatch(
    projectConfig.mainFilePath,
    makePackagePatch(androidConfig.packageInstance, params, name)
  );

  revokePatch(
    projectConfig.mainFilePath,
    makeImportPatch(androidConfig.packageImportPath)
  );
};
