/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getPlist from '../getPlist';

const xcode = require('xcode');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../__fixtures__/project.pbxproj'),
);

describe('ios::getPlist', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return null when `.plist` file missing', () => {
    const plistPath = getPlist(project, process.cwd());
    expect(plistPath).toBeNull();
  });

  // @todo - Happy scenario
});
