/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

import xcode from 'xcode';
import path from 'path';
import PbxFile from 'xcode/lib/pbxFile';
import lodash from 'lodash';

import addProjectToLibraries from '../../ios/addProjectToLibraries';

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::addProjectToLibraries', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should append file to Libraries group', () => {
    const file = new PbxFile('fakePath');
    const libraries = project.pbxGroupByName('Libraries');

    addProjectToLibraries(libraries, file);

    const child = lodash.last(libraries.children);

    expect(child.comment).toBe(file.basename);
  });
});
