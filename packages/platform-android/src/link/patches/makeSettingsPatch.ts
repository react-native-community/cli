/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import slash from 'slash';
import normalizeProjectName from './normalizeProjectName';

export default function makeSettingsPatch(
  name: string,
  androidConfig: {sourceDir: string},
  projectConfig: {settingsGradlePath: string},
) {
  // Gradle expects paths to be posix even on Windows
  const projectDir = slash(
    path.relative(
      path.dirname(projectConfig.settingsGradlePath),
      androidConfig.sourceDir,
    ),
  );
  const normalizedProjectName = normalizeProjectName(name);

  return {
    pattern: '\n',
    patch:
      `include ':${normalizedProjectName}'\n` +
      `project(':${normalizedProjectName}').projectDir = ` +
      `new File(rootProject.projectDir, '${projectDir}')\n`,
  };
}
