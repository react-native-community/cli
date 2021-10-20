/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

import getAssetDestPathIOS from '../getAssetDestPathIOS';

jest.dontMock('../getAssetDestPathIOS');

const path = require('path');

describe('getAssetDestPathIOS', () => {
  it('should build correct path', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    expect(getAssetDestPathIOS(asset, 1)).toBe(
      path.normalize('assets/test/icon.png'),
    );
  });

  it('should consider scale', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    expect(getAssetDestPathIOS(asset, 2)).toBe(
      path.normalize('assets/test/icon@2x.png'),
    );
    expect(getAssetDestPathIOS(asset, 3)).toBe(
      path.normalize('assets/test/icon@3x.png'),
    );
  });

  it('should handle assets with a relative path outside of root', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/../../test',
    };

    expect(getAssetDestPathIOS(asset, 1)).toBe(
      path.normalize('assets/__test/icon.png'),
    );
  });
});
