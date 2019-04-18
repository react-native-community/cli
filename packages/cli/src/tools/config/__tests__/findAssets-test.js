/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

import findAssets from '../findAssets';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

describe('findAssets', () => {
  beforeEach(() => {
    fs.__setMockFilesystem({
      testDir: {
        fonts: {
          'A.ttf': '',
          'B.ttf': '',
        },
        images: {
          'C.jpg': '',
        },
      },
    });
  });

  it('returns an array of all files in given folders', () => {
    const assets = findAssets('/testDir', ['fonts', 'images']);

    expect(Array.isArray(assets)).toBeTruthy();
    expect(assets).toHaveLength(3);
  });

  it('prepends assets paths with the folder path', () => {
    const assets = findAssets('/testDir', ['fonts', 'images']);

    assets.forEach(assetPath => {
      expect(assetPath).toContain('testDir');
    });
  });

  it('returns an empty array if given assets are null', () => {
    expect(findAssets('/testDir', null)).toHaveLength(0);
  });
});
