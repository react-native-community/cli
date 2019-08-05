/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import addFileToProject from '../addFileToProject';
import removeProjectFromProject from '../removeProjectFromProject';

const xcode = require('xcode');
const pbxFile = require('xcode/lib/pbxFile');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../__fixtures__/project.pbxproj'),
);
const filePath = '../__fixtures__/linearGradient.pbxproj';

describe('ios::addFileToProject', () => {
  beforeEach(() => {
    project.parseSync();
    addFileToProject(project, filePath);
  });

  it('should return removed file', () => {
    expect(
      removeProjectFromProject(project, filePath) instanceof pbxFile,
    ).toBeTruthy();
  });

  it('should remove file from a project', () => {
    const file = removeProjectFromProject(project, filePath);
    expect(project.pbxFileReferenceSection()[file.fileRef]).not.toBeDefined();
  });

  // todo(mike): add in .xcodeproj after Xcode modifications so we can test extra
  // removals later.
  it.todo('should remove file from PBXContainerProxy');
});
