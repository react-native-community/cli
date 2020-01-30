/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import getLaunchPackageName from '../getLaunchPackageName';
import {createBuildGradleMocks} from './testHelpers';

describe('run-android::getLaunchPackageName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a well formed package name for unflavored build type', () => {
    createBuildGradleMocks(false);

    const basePackageName = 'com.mycompany.app';

    expect(getLaunchPackageName('debug')).toBe(`${basePackageName}.debug`);
  });

  it('returns a well formed package for flavored build type', () => {
    createBuildGradleMocks(true);

    const basePackageName = 'com.mycompany.app';

    expect(getLaunchPackageName('demoDebug')).toBe(
      `${basePackageName}.demo.debug`,
    );
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});
