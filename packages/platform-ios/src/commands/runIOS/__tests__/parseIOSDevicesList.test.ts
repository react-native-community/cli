/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import parseIOSDevicesList from '../parseIOSDevicesList';

jest.dontMock('../parseIOSDevicesList');

describe('parseIOSDevicesList', () => {
  it('parses typical output', () => {
    const devices = parseIOSDevicesList(
      [
        'Known Devices:',
        'Maxs MacBook Pro [11111111-1111-1111-1111-111111111111]',
        "Max's iPhone (9.2) [00008030-000D19512210802E]",
        'iPad 2 (9.3) [07538CE4-675B-4EDA-90F2-3DD3CD93309D] (Simulator)',
        'iPad Air (9.3) [0745F6D1-6DC5-4427-B9A6-6FBA327ED65A] (Simulator)',
        'iPhone 6s (9.3) [3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4] (Simulator)',
        'Known Templates:',
        'Activity Monitor',
        'Blank',
        'System Usage',
        'Zombies',
      ].join('\n'),
    );

    expect(devices).toEqual([
      {
        name: "Max's iPhone",
        udid: '00008030-000D19512210802E',
        version: '9.2',
        isSimulator: false,
      },
      {
        name: 'iPad 2',
        udid: '07538CE4-675B-4EDA-90F2-3DD3CD93309D',
        version: '9.3',
        isSimulator: true,
      },
      {
        name: 'iPad Air',
        udid: '0745F6D1-6DC5-4427-B9A6-6FBA327ED65A',
        version: '9.3',
        isSimulator: true,
      },
      {
        name: 'iPhone 6s',
        udid: '3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4',
        version: '9.3',
        isSimulator: true,
      },
    ]);
  });

  it('ignores garbage', () => {
    expect(parseIOSDevicesList('Something went terribly wrong (-42)')).toEqual(
      [],
    );
  });
});
