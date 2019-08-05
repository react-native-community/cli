/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import findPodTargetLine from '../findPodTargetLine';
import readPodfile from '../readPodfile';

const path = require('path');

const PODFILES_PATH = path.join(__dirname, '../__fixtures__');

describe('pods::findPodTargetLine', () => {
  it('returns null if file is not Podfile', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'Info.plist'));
    expect(findPodTargetLine(podfile, 'name')).toBeNull();
  });

  it('returns null if there is not matching project name', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileSimple'));
    expect(findPodTargetLine(podfile, 'invalidName')).toBeNull();
  });

  it('returns correct line if there is a matching project', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileSimple'));
    expect(findPodTargetLine(podfile, 'Testing')).toBe(4);
  });
});
