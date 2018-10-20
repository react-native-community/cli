/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');
const findAndroidAppFolder = require('../../android/findAndroidAppFolder');
const mocks = require('../../__fixtures__/android');

describe('android::findAndroidAppFolder', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      nested: {
        android: {
          app: mocks.valid,
        },
      },
      flat: {
        android: mocks.valid,
      },
    });
  });

  it('returns an android app folder if it exists in the given folder', () => {
    expect(findAndroidAppFolder('/flat')).toBe('android');
    expect(findAndroidAppFolder('/nested')).toBe('android/app');
  });

  it('returns `null` if there is no android app folder', () => {
    expect(findAndroidAppFolder('/empty')).toBeNull();
  });
});
