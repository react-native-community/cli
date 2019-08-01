/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import findManifest from '../findManifest';
import * as mocks from '../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

describe('android::findManifest', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flat: {
        android: mocks.valid,
      },
    });
  });

  it('returns a manifest path if file exists in the folder', () => {
    expect(typeof findManifest('/flat')).toBe('string');
  });

  it('returns `null` if there is no manifest in the folder', () => {
    expect(findManifest('/empty')).toBeNull();
  });
});
