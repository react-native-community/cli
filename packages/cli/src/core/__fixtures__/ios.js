/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import path from 'path';

const fs = jest.requireActual('fs');

export const valid = {
  'demoProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(
      path.join(__dirname, './files/project.pbxproj')
    ),
  },
  'TestPod.podspec': 'empty',
};

export const validTestName = {
  'MyTestProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(
      path.join(__dirname, './files/project.pbxproj')
    ),
  },
};

export const pod = {
  'TestPod.podspec': 'empty',
};
