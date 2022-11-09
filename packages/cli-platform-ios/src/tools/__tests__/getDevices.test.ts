/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import execa from 'execa';
import {getDevices} from '../getDevices';

jest.dontMock('../getDevices');

jest.mock('execa', () => {
  return {sync: jest.fn()};
});

const expectedOutput = {
  xctraceListLatest: {
    stdout: [
      '== Devices ==',
      'Maxs MacBook Pro (11111111-1111-1111-1111-111111111111)',
      "Max's iPhone (9.2) (00008030-000D19512210802E)",
      'other-iphone (9.2) (72a186ccfd93472a186ccfd934)',
      '',
      '== Simulators ==',
      'iPad 2 (9.3) (07538CE4-675B-4EDA-90F2-3DD3CD93309D)',
      'iPad Air (9.3) (0745F6D1-6DC5-4427-B9A6-6FBA327ED65A)',
      'iPhone 6s (9.3) (3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4)',
      'Known Templates:',
      'Activity Monitor',
      'Blank',
      'System Usage',
      'Zombies',
    ].join('\n'),
    stderr: '',
  },
  xctraceListOld: {
    stderr: [
      '== Devices ==',
      'Maxs MacBook Pro (11111111-1111-1111-1111-111111111111)',
      "Max's iPhone (9.2) (00008030-000D19512210802E)",
      'other-iphone (9.2) (72a186ccfd93472a186ccfd934)',
      '',
      '== Simulators ==',
      'iPad 2 (9.3) (07538CE4-675B-4EDA-90F2-3DD3CD93309D)',
      'iPad Air (9.3) (0745F6D1-6DC5-4427-B9A6-6FBA327ED65A)',
      'iPhone 6s (9.3) (3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4)',
      'Known Templates:',
      'Activity Monitor',
      'Blank',
      'System Usage',
      'Zombies',
    ].join('\n'),
  },
  depracatedList: {
    stdout: [
      'Known Devices:',
      'Maxs MacBook Pro [11111111-1111-1111-1111-111111111111]',
      "Max's iPhone (9.2) [00008030-000D19512210802E]",
      'other-iphone (9.2) [72a186ccfd93472a186ccfd934]',
      'iPad 2 (9.3) [07538CE4-675B-4EDA-90F2-3DD3CD93309D] (Simulator)',
      'iPad Air (9.3) [0745F6D1-6DC5-4427-B9A6-6FBA327ED65A] (Simulator)',
      'iPhone 6s (9.3) [3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4] (Simulator)',
      'Known Templates:',
      'Activity Monitor',
      'Blank',
      'System Usage',
      'Zombies',
    ].join('\n'),
    stderr: '',
  },
};

describe('getDevices', () => {
  it('parses typical output for xctrace list for xcode 12.5+', () => {
    (execa.sync as jest.Mock).mockReturnValueOnce(
      expectedOutput.xctraceListLatest,
    );
    const devices = getDevices();

    expect(devices).toEqual([
      {
        name: 'Maxs MacBook Pro',
        udid: '11111111-1111-1111-1111-111111111111',
        type: 'catalyst',
      },
      {
        name: "Max's iPhone",
        udid: '00008030-000D19512210802E',
        version: '9.2',
        type: 'device',
      },
      {
        name: 'other-iphone',
        type: 'device',
        udid: '72a186ccfd93472a186ccfd934',
        version: '9.2',
      },
      {
        name: 'iPad 2',
        udid: '07538CE4-675B-4EDA-90F2-3DD3CD93309D',
        version: '9.3',
        type: 'simulator',
      },
      {
        name: 'iPad Air',
        udid: '0745F6D1-6DC5-4427-B9A6-6FBA327ED65A',
        version: '9.3',
        type: 'simulator',
      },
      {
        name: 'iPhone 6s',
        udid: '3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4',
        version: '9.3',
        type: 'simulator',
      },
    ]);
  });

  it('parses typical output for xctrace list for xcode upto 12.5', () => {
    (execa.sync as jest.Mock).mockReturnValueOnce(
      expectedOutput.xctraceListOld,
    );
    const devices = getDevices();

    expect(devices).toEqual([
      {
        name: 'Maxs MacBook Pro',
        udid: '11111111-1111-1111-1111-111111111111',
        type: 'catalyst',
      },
      {
        name: "Max's iPhone",
        udid: '00008030-000D19512210802E',
        version: '9.2',
        type: 'device',
      },
      {
        name: 'other-iphone',
        type: 'device',
        udid: '72a186ccfd93472a186ccfd934',
        version: '9.2',
      },
      {
        name: 'iPad 2',
        udid: '07538CE4-675B-4EDA-90F2-3DD3CD93309D',
        version: '9.3',
        type: 'simulator',
      },
      {
        name: 'iPad Air',
        udid: '0745F6D1-6DC5-4427-B9A6-6FBA327ED65A',
        version: '9.3',
        type: 'simulator',
      },
      {
        name: 'iPhone 6s',
        udid: '3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4',
        version: '9.3',
        type: 'simulator',
      },
    ]);
  });

  it('parses typical output for deprecated list', () => {
    (execa.sync as jest.Mock).mockImplementation((_, [command]) => {
      if (command === 'xctrace') {
        throw new Error('some error');
      }
      return expectedOutput.depracatedList;
    }).mock;
    const devices = getDevices();

    expect(devices).toEqual([
      {
        name: 'Maxs MacBook Pro',
        udid: '11111111-1111-1111-1111-111111111111',
        type: 'catalyst',
      },
      {
        name: "Max's iPhone",
        udid: '00008030-000D19512210802E',
        version: '9.2',
        type: 'device',
      },
      {
        name: 'other-iphone',
        type: 'device',
        udid: '72a186ccfd93472a186ccfd934',
        version: '9.2',
      },
      {
        name: 'iPad 2',
        udid: '07538CE4-675B-4EDA-90F2-3DD3CD93309D',
        version: '9.3',
        type: 'simulator',
      },
      {
        name: 'iPad Air',
        udid: '0745F6D1-6DC5-4427-B9A6-6FBA327ED65A',
        version: '9.3',
        type: 'simulator',
      },
      {
        name: 'iPhone 6s',
        udid: '3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4',
        version: '9.3',
        type: 'simulator',
      },
    ]);
  });

  it('ignores garbage', () => {
    (execa.sync as jest.Mock).mockReturnValueOnce({
      stdout: 'Something went terribly wrong (-42)',
      stderr: '',
    });
    expect(getDevices()).toEqual([]);
  });
});
