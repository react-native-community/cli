/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import normalizeProjectName from './normalizeProjectName';

const depConfigs = ['compile', 'api', 'implementation'];

export default function makeBuildPatch(name: string, buildGradlePath?: string) {
  const normalizedProjectName = normalizeProjectName(name);
  const installPattern = new RegExp(
    buildDepRegExp(normalizedProjectName, ...depConfigs),
  );

  return {
    installPattern,
    pattern: /[^ \t]dependencies {(\r\n|\n)/,
    patch: makePatchString(normalizedProjectName, buildGradlePath),
  };
}

function makePatchString(
  normalizedProjectName: string,
  buildGradlePath?: string,
) {
  const defaultPatchString = `    implementation project(':${normalizedProjectName}')\n`;
  if (!buildGradlePath) {
    return defaultPatchString;
  }

  const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

  for (const config of depConfigs) {
    const depPattern = new RegExp(
      buildDepRegExp(normalizedProjectName, config),
    );
    if (depPattern.test(buildGradle)) {
      return `    ${config} project(':${normalizedProjectName}')\n`;
    }
  }

  return defaultPatchString;
}

function buildDepRegExp(
  normalizedProjectName: string,
  ...configs: Array<string>
) {
  const orConfigs = configs.join('|');
  return `(${orConfigs})\\w*\\s*\\(*project\\s*\\(['"]:${normalizedProjectName}['"]\\)`;
}
