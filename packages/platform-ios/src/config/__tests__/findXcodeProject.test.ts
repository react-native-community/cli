/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import findXcodeProject from '../findXcodeProject';

jest.dontMock('../findXcodeProject');

describe('findXcodeProject', () => {
  it('should find *.xcodeproj file', () => {
    expect(
      findXcodeProject([
        '.DS_Store',
        'AwesomeApp',
        'AwesomeApp.xcodeproj',
        'AwesomeAppTests',
        'PodFile',
        'Podfile.lock',
        'Pods',
      ]),
    ).toEqual({
      name: 'AwesomeApp.xcodeproj',
      isWorkspace: false,
    });
  });

  it('should prefer *.xcworkspace', () => {
    expect(
      findXcodeProject([
        '.DS_Store',
        'AwesomeApp',
        'AwesomeApp.xcodeproj',
        'AwesomeApp.xcworkspace',
        'AwesomeAppTests',
        'PodFile',
        'Podfile.lock',
        'Pods',
      ]),
    ).toEqual({
      name: 'AwesomeApp.xcworkspace',
      isWorkspace: true,
    });
  });

  it('should return null if nothing found', () => {
    expect(
      findXcodeProject([
        '.DS_Store',
        'AwesomeApp',
        'AwesomeAppTests',
        'PodFile',
        'Podfile.lock',
        'Pods',
      ]),
    ).toEqual(null);
  });
});
