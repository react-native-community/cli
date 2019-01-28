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
import { pod } from '../../__fixtures__/ios';
import findPodspecName from '../../ios/findPodspecName';
import projects from '../../__fixtures__/projects';

jest.mock('path');
jest.mock('fs');

describe('ios::findPodspecName', () => {
  it('returns null if there is not podspec file', () => {
    fs.__setMockFilesystem(projects.flat);
    expect(findPodspecName('')).toBeNull();
  });

  it('returns podspec name if only one exists', () => {
    fs.__setMockFilesystem(pod);
    expect(findPodspecName('/')).toBe('TestPod');
  });

  it('returns podspec name that match packet directory', () => {
    fs.__setMockFilesystem({
      user: {
        PacketName: {
          'Another.podspec': 'empty',
          'PacketName.podspec': 'empty',
        },
      },
    });
    expect(findPodspecName('/user/PacketName')).toBe('PacketName');
  });

  it('returns first podspec name if not match in directory', () => {
    fs.__setMockFilesystem({
      user: {
        packet: {
          'Another.podspec': 'empty',
          'PacketName.podspec': 'empty',
        },
      },
    });
    expect(findPodspecName('/user/packet')).toBe('Another');
  });
});
