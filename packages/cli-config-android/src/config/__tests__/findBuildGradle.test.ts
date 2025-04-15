/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {findBuildGradle} from '../findBuildGradle';
import * as mocks from '../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

describe('findBuildGradle for apps', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flat: {
        android: mocks.validApp,
      },
    });
  });

  it('returns the app gradle path if file exists in the folder', () => {
    expect(findBuildGradle('/flat/android', 'app')).toBe(
      '/flat/android/app/build.gradle',
    );
  });

  it('returns `null` if there is no gradle in the app folder', () => {
    expect(findBuildGradle('/empty', 'app')).toBeNull();
  });
});

describe('findBuildGradle for libraries', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flat: {
        android: mocks.valid,
      },
    });
  });

  it('returns the app gradle path if file exists in the folder', () => {
    expect(findBuildGradle('/flat/android', '')).toBe(
      '/flat/android/build.gradle',
    );
  });

  it('returns `null` if there is no gradle in the app folder', () => {
    expect(findBuildGradle('/empty', '')).toBeNull();
  });
});
