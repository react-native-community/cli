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

function createMocks(useFlavor) {
  const actualFs = jest.requireActual('fs');
  const actualPath = jest.requireActual('path');

  fs.readFileSync = jest.fn(filename => {
    switch (filename) {
      case actualPath.join('app', 'build.gradle'):
        return actualFs.readFileSync(
          actualPath.join(
            __dirname,
            '..',
            '__fixtures__',
            useFlavor ? 'sampleBuildWithFlavor.gradle' : 'sampleBuild.gradle',
          ),
          'utf8',
        );
      // Use default case to catch generated debug manifest
      default:
        return actualFs.readFileSync(
          actualPath.join(
            __dirname,
            '..',
            '__fixtures__',
            useFlavor
              ? 'sampleGeneratedDemoDebugManifest.xml'
              : 'sampleGeneratedDebugManifest.xml',
          ),
          'utf8',
        );
    }
  });
}

describe('run-android::getLaunchPackageName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a well formed package name for unflavored build type', () => {
    createMocks(/* useFlavor: */ false);

    const basePackageName = 'com.mycompany.app';

    expect(getLaunchPackageName('debug')).toBe(`${basePackageName}.debug`);
  });

  it('returns a well formed package for flavored build type', () => {
    createMocks(/* useFlavor: */ true);

    const basePackageName = 'com.mycompany.app';

    expect(getLaunchPackageName('demoDebug')).toBe(
      `${basePackageName}.demo.debug`,
    );
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});
