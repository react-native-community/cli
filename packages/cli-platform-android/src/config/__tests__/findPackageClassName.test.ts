/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as mocks from '../__fixtures__/android';
import findPackageClassName, {matchClassName} from '../findPackageClassName';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

['posix', 'win32'].forEach((platform) => {
  let root;
  describe(`android::findPackageClassName (${platform})`, () => {
    beforeAll(() => {
      root = fs.__setMockFilesystem(
        {
          empty: {},
          flatJava: {
            android: mocks.valid,
          },
          flatKotlin: {
            android: mocks.validKotlin,
          },
        },
        platform,
      );
    });

    it('returns manifest content if file exists in the folder', () => {
      expect(typeof findPackageClassName(`${root}flatJava`)).toBe('string');
    });

    it('returns the name of the java class implementing ReactPackage', () => {
      expect(findPackageClassName(`${root}flatJava`)).toBe(
        'SomeExampleJavaPackage',
      );
    });

    it('returns the name of the kotlin class implementing ReactPackage', () => {
      expect(findPackageClassName(`${root}flatKotlin`)).toBe(
        'SomeExampleKotlinPackage',
      );
    });

    it('returns `null` if there are no matches', () => {
      expect(findPackageClassName(`${root}empty`)).toBeNull();
    });
  });
});

describe('android:FindPackageClassNameRegex', () => {
  [
    mocks.findPackagesClassNameKotlinValid,
    mocks.findPackagesClassNameJavaValid,
  ].forEach((files) => {
    it('returns the name of the kotlin/java class implementing ReactPackage', () => {
      files.forEach((file) => {
        expect(matchClassName(file)[1]).toBe('SomeExampleKotlinPackage');
      });
    });
  });

  [
    mocks.findPackagesClassNameKotlinNotValid,
    mocks.findPackagesClassNameJavaNotValid,
  ].forEach((files) => {
    it('returns `null` if there are no matches for kotlin/java classes', () => {
      files.forEach((file) => {
        expect(matchClassName(file)).toBeNull();
      });
    });
  });
});
