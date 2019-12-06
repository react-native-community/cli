/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import plistParser, {PlistValue} from 'plist';
import fs from 'fs';
import getPlistPath from './getPlistPath';

/**
 * Writes to Info.plist located in the iOS project
 *
 * Returns `null` if INFOPLIST_FILE is not specified or file is non-existent.
 */
export default function writePlist(
  project: any,
  sourceDir: string,
  plist: PlistValue | null,
) {
  const plistPath = getPlistPath(project, sourceDir);

  if (!plistPath) {
    return null;
  }

  // We start with an offset of -1, because Xcode maintains a custom
  // indentation of the plist.
  // Ref: https://github.com/facebook/react-native/issues/11668
  return fs.writeFileSync(
    plistPath,
    // @ts-ignore Type mismatch
    `${plistParser.build(plist, {indent: '\t', offset: -1})}\n`,
  );
}
