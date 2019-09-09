/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import readPodfile from '../readPodfile';
import findMarkedLinesInPodfile from '../findMarkedLinesInPodfile';

const path = require('path');

const PODFILES_PATH = path.join(__dirname, '../__fixtures__');

describe('pods::findMarkedLinesInPodfile', () => {
  it('returns empty array if file is not Podfile', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'Info.plist'));
    expect(findMarkedLinesInPodfile(podfile)).toEqual([]);
  });

  it('returns empty array for Simple Podfile', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileSimple'));
    expect(findMarkedLinesInPodfile(podfile)).toEqual([]);
  });

  it('returns correct line numbers for Podfile with marker', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileWithMarkers'));
    const expectedObject = [
      {line: 18, indentation: 2},
      {line: 31, indentation: 4},
    ];
    expect(findMarkedLinesInPodfile(podfile)).toEqual(expectedObject);
  });
});
