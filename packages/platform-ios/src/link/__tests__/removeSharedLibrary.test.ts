/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import addSharedLibraries from '../addSharedLibraries';
import removeSharedLibraries from '../removeSharedLibraries';
import getGroup from '../getGroup';

const xcode = require('xcode');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../__fixtures__/project.pbxproj'),
);

describe('ios::removeSharedLibraries', () => {
  beforeEach(() => {
    project.parseSync();
    addSharedLibraries(project, ['libc++.tbd', 'libz.tbd']);
  });

  it('should remove only the specified shared library', () => {
    removeSharedLibraries(project, ['libc++.tbd']);

    const frameworksGroup = getGroup(project, 'Frameworks');
    expect(frameworksGroup.children).toHaveLength(1);
    expect(frameworksGroup.children[0].comment).toEqual('libz.tbd');
  });

  it('should ignore missing shared libraries', () => {
    removeSharedLibraries(project, ['libxml2.tbd']);

    const frameworksGroup = getGroup(project, 'Frameworks');
    expect(frameworksGroup.children).toHaveLength(2);
  });
});
