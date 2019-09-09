/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const MARKER_TEXT = '# Add new pods below this line';

export default function findMarkedLinesInPodfile(podLines: Array<string>) {
  const result = [];
  for (let i = 0, len = podLines.length; i < len; i++) {
    if (podLines[i].includes(MARKER_TEXT)) {
      result.push({line: i + 1, indentation: podLines[i].indexOf('#')});
    }
  }
  return result;
}
