/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

import fs from 'fs';
import findManifest from '../../android/findManifest';
import readManifest from '../../android/readManifest';
import { valid } from '../../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

describe('android::readManifest', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      nested: {
        android: {
          app: valid,
        },
      },
    });
  });

  it('returns manifest content if file exists in the folder', () => {
    const manifestPath = findManifest('/nested');
    expect(readManifest(manifestPath)).not.toBeNull();
    expect(typeof readManifest(manifestPath)).toBe('object');
  });

  it('throws an error if there is no manifest in the folder', () => {
    const fakeManifestPath = findManifest('/empty');
    expect(() => {
      readManifest(fakeManifestPath);
    }).toThrow();
  });
});
