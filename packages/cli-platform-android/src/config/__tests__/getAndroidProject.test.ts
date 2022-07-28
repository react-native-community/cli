/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {validatePackageName} from '../getAndroidProject';

describe('android::getAndroidProject', () => {
  const expectedResults = {
    'com.app': true,
    'com.example.app': true,
    'com.my_app': true,
    'org.my_app3': true,
    'com.App': true,
    'com.Example.APP1': true,
    'COM.EXAMPLE.APP': true,
    '': false,
    com: false,
    'com.3example.app': false,
    'com.my_app*': false,
    'org.my-app3': false,
    'com.App ': false,
    'com.Example.APP#1': false,
  };

  Object.keys(expectedResults).forEach((packageName) => {
    it(`should validate package name "${packageName}" correctly`, () => {
      expect(validatePackageName(packageName)).toBe(
        expectedResults[packageName],
      );
    });
  });
});
