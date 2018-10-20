/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const path = require('path');
const readPodfile = require('../../pods/readPodfile');
const findMarkedLinesInPodfile = require('../../pods/findMarkedLinesInPodfile');

const PODFILES_PATH = path.join(__dirname, '../../__fixtures__/pods');
const LINE_AFTER_TARGET_IN_TEST_PODFILE = 4;

describe('pods::findMarkedLinesInPodfile', () => {
  it('returns empty array if file is not Podfile', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, '../Info.plist'));
    expect(findMarkedLinesInPodfile(podfile)).toEqual([]);
  });

  it('returns empty array for Simple Podfile', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileSimple'));
    expect(
      findMarkedLinesInPodfile(podfile, LINE_AFTER_TARGET_IN_TEST_PODFILE),
    ).toEqual([]);
  });

  it('returns correct line numbers for Podfile with marker', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileWithMarkers'));
    const expectedObject = [
      {line: 18, indentation: 2},
      {line: 31, indentation: 4},
    ];
    expect(
      findMarkedLinesInPodfile(podfile, LINE_AFTER_TARGET_IN_TEST_PODFILE),
    ).toEqual(expectedObject);
  });
});
