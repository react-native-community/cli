/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import isInstalled from '../isInstalled';

const path = require('path');

const projectConfig = {
  buildGradlePath: path.join(__dirname, '../__fixtures__/patchedBuild.gradle'),
};

describe('android::isInstalled', () => {
  test.each([
    ['test-impl', true],
    ['test-impl-config', true],
    ['test-impl-config-spaces', true],
    ['test-impl-debug', true],
    ['test-impl-abc', true],
    ['test-compile', true],
    ['test-compile-debug', true],
    ['test-compile-abc', true],
    ['test-api', true],
    ['test-api-debug', true],
    ['test-api-abc', true],
    ['test-not-there-yet', false],
  ])(
    'properly detects if %p project is already in build.gradle',
    (project: string, isPresent: boolean) => {
      expect(isInstalled(projectConfig, project)).toBe(isPresent);
    },
  );
});
