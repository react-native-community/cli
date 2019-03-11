/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import normalizeProjectName from './normalizeProjectName';

export default function makeBuildPatch(name, buildGradlePath) {
  const normalizedProjectName = normalizeProjectName(name);
  const installPattern = new RegExp(
    `(implementation|api|compile)\\w*\\s*\\(*project\\s*\\(['"]:${normalizedProjectName}['"]\\)`,
  );

  return {
    installPattern,
    pattern: /[^ \t]dependencies {(\r\n|\n)/,
    patch: makePatchString(normalizedProjectName, buildGradlePath),
  };
}

function makePatchString(normalizedProjectName, buildGradlePath) {
  const defaultPatchString = `    implementation project(':${normalizedProjectName}')\n`;
  if (!buildGradlePath) {
    return defaultPatchString;
  }

  const buildGradle = fs.readFileSync(buildGradlePath);

  const depTypes = ['compile', 'api', 'implementation'];
  for (const type of depTypes) {
    const depPattern = new RegExp(
      `(${type})\\w*\\s*\\(*project\\s*\\(['"]:${normalizedProjectName}['"]\\)`,
    );

    if (depPattern.test(buildGradle)) {
      return `    ${type} project(':${normalizedProjectName}')\n`;
    }
  }

  return defaultPatchString;
}
