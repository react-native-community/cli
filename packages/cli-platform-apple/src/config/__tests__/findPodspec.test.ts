/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import findPodspec from '../findPodspec';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

describe('ios::findPodspec', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flat: {
        'TestPod.podspec': 'empty',
      },
      multiple: {
        user: {
          PacketName: {
            'Another.podspec': 'empty',
            'PacketName.podspec': 'empty',
          },
        },
      },
      multiple2: {
        user: {
          packet: {
            'Another.podspec': 'empty',
            'PacketName.podspec': 'empty',
          },
        },
      },
    });
  });

  it('returns null if there is not podspec file', () => {
    expect(findPodspec('/empty')).toBeNull();
  });

  it('returns podspec name if only one exists', () => {
    expect(findPodspec('/flat')).toBe('/flat/TestPod.podspec');
  });

  it('returns podspec name that match packet directory', () => {
    expect(findPodspec('/multiple/user/PacketName')).toBe(
      '/multiple/user/PacketName/PacketName.podspec',
    );
  });

  it('returns first podspec name if not match in directory', () => {
    expect(findPodspec('/multiple2/user/packet')).toBe(
      '/multiple2/user/packet/Another.podspec',
    );
  });
});
