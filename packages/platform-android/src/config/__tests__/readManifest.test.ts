/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import findManifest from '../findManifest';
import readManifest from '../readManifest';
import * as mocks from '../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

describe('android::readManifest', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      nested: {
        android: {
          app: mocks.valid,
        },
      },
      one: {
        android: {
          app: mocks.oneActivity,
        },
      },
    });
  });

  it('returns manifest content if file exists in the folder', () => {
    const manifestPath = findManifest('/nested');
    const manifest = readManifest(manifestPath);
    expect(manifest).not.toBeNull();
    expect(typeof manifest).toBe('object');
    expect(manifest.packageName).toBe('com.some.example');
    expect(manifest.mainActivity).toBe('.MainActivity');
    expect(manifest.name).toBe('.MainApplication');
  });

  it('returns manifest content if only one activity in manifest', () => {
    const manifestPath = findManifest('/one');
    const manifest = readManifest(manifestPath);
    expect(manifest).not.toBeNull();
    expect(typeof manifest).toBe('object');
    expect(manifest.packageName).toBe('com.some.example');
    expect(manifest.mainActivity).toBe('.MainActivity');
    expect(manifest.name).toBe('.MainApplication');
  });

  it('throws an error if there is no manifest in the folder', () => {
    const fakeManifestPath = findManifest('/empty');
    expect(() => {
      readManifest(fakeManifestPath);
    }).toThrow();
  });
});
