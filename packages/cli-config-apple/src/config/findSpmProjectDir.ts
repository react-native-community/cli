/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import path from 'path';
import {ApplePlatform} from '../types';

/**
 * Written by `react-native spm` (React Native 0.87+) inside the `.xcodeproj`
 * bundle it migrated to Swift Package Manager, and removed by
 * `react-native spm deinit`.
 */
const SPM_INJECTED_MARKER = '.spm-injected.json';

/**
 * Returns the folder holding an Xcode project migrated to Swift Package
 * Manager, or `null` when there is none.
 */
export default function findSpmProjectDir(
  cwd: string,
  platformName: ApplePlatform,
): string | null {
  const searchDirs =
    path.basename(cwd) === platformName
      ? [cwd]
      : [path.join(cwd, platformName), cwd];

  return searchDirs.find(isSpmProjectDir) ?? null;
}

function isSpmProjectDir(dir: string): boolean {
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return false;
  }

  return entries.some(
    (entry) =>
      entry.endsWith('.xcodeproj') &&
      fs.existsSync(path.join(dir, entry, SPM_INJECTED_MARKER)),
  );
}
