/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import addSharedLibraries from '../addSharedLibraries';
import getGroup from '../getGroup';

const xcode = require('xcode');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../__fixtures__/project.pbxproj'),
);

describe('ios::addSharedLibraries', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should automatically create Frameworks group', () => {
    expect(getGroup(project, 'Frameworks')).toBeNull();
    addSharedLibraries(project, ['libz.tbd']);
    expect(getGroup(project, 'Frameworks')).not.toBeNull();
  });

  it('should add shared libraries to project', () => {
    addSharedLibraries(project, ['libz.tbd']);

    const frameworksGroup = getGroup(project, 'Frameworks');
    expect(frameworksGroup.children).toHaveLength(1);
    expect(frameworksGroup.children[0].comment).toEqual('libz.tbd');

    addSharedLibraries(project, ['MessageUI.framework']);
    expect(frameworksGroup.children).toHaveLength(2);
  });

  it('should not add duplicate libraries to project', () => {
    addSharedLibraries(project, ['libz.tbd']);
    addSharedLibraries(project, ['libz.tbd']);

    const frameworksGroup = getGroup(project, 'Frameworks');
    expect(frameworksGroup.children).toHaveLength(1);
  });
});
