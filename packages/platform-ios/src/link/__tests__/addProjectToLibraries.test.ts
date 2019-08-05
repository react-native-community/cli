/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import addProjectToLibraries from '../addProjectToLibraries';

const xcode = require('xcode');
const path = require('path');
const PbxFile = require('xcode/lib/pbxFile');
const {last} = require('lodash');

const project = xcode.project(
  path.join(__dirname, '../__fixtures__/project.pbxproj'),
);

describe('ios::addProjectToLibraries', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should append file to Libraries group', () => {
    const file = new PbxFile('fakePath');
    const libraries = project.pbxGroupByName('Libraries');

    addProjectToLibraries(libraries, file);

    const child = last(libraries.children);

    expect(child.comment).toBe(file.basename);
  });
});
