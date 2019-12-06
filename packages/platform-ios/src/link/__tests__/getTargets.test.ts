/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getTargets from '../getTargets';

const xcode = require('xcode');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../__fixtures__/project.pbxproj'),
);

describe('ios::getTargets', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return an array of project targets', () => {
    const targets = getTargets(project);
    expect(targets).toHaveLength(2);
    expect(targets[0].name).toContain('Basic.app');
    expect(targets[1].name).toContain('BasicTests.xctest');
  });
});
