/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import getLaunchPackageName from '../getLaunchPackageName';

jest.mock('fs');
jest.mock('path');

describe('run-android::getLaunchPackageName', () => {
  const actualFs = jest.requireActual('fs');
  const actualPath = jest.requireActual('path');

  fs.readFileSync = jest.fn(filename => {
    switch (filename) {
      case 'app/build.gradle':
        return actualFs.readFileSync(
          actualPath.join(__dirname, '../__fixtures__/sampleBuild.gradle'),
          'utf8',
        );
      // Use default case to catch generated debug manifest
      default:
        return actualFs.readFileSync(
          actualPath.join(
            __dirname,
            '../__fixtures__/sampleGeneratedDebugManifest.xml',
          ),
          'utf8',
        );
    }
  });

  it('returns a well formed package name for debug build type', () => {
    const basePackageName = 'com.mycompany.app';
    const variant = 'debug';

    // Assert
    expect(getLaunchPackageName(variant)).toBe(`${basePackageName}.${variant}`);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});
