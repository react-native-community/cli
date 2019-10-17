/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import findAndroidAppFolder from '../findAndroidAppFolder';
import * as mocks from '../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

describe('android::findAndroidAppFolder', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flat: {
        android: mocks.valid,
      },
    });
  });

  it('returns an android folder if it exists in the given folder', () => {
    expect(findAndroidAppFolder('/flat')).toBe('android');
  });

  it('returns null if there is no android folder', () => {
    expect(findAndroidAppFolder('/empty')).toBeNull();
  });
});
