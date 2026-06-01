/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as mocks from '../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

const getDependencyConfig = require('../').dependencyConfig;

const userConfig = {};

describe('android::getDependencyConfig', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      nested: {
        android: {
          app: mocks.valid,
        },
      },
      corrupted: {
        android: {
          app: mocks.corrupted,
        },
      },
      noPackage: {
        android: {},
      },
      pureCxx: {
        android: {},
      },
    });
  });

  it('returns an object with android project configuration', () => {
    const config = getDependencyConfig('/nested', userConfig);

    expect(config).not.toBeNull();
    expect(typeof config).toBe('object');
    expect(config).toMatchObject({
      cmakeListsPath:
        '/nested/android/build/generated/source/codegen/jni/CMakeLists.txt',
      isPureCxxDependency: false,
    });
  });

  it('sets cmakeListsPath to null for pure C++ dependencies', () => {
    expect(
      getDependencyConfig('/pureCxx', {
        cxxModuleCMakeListsModuleName: 'PureCxxModule',
        cxxModuleCMakeListsPath: 'src/main/jni/CMakeLists.txt',
        cxxModuleHeaderName: 'PureCxxModule.h',
      }),
    ).toMatchObject({
      cmakeListsPath: null,
      cxxModuleCMakeListsModuleName: 'PureCxxModule',
      cxxModuleCMakeListsPath: '/pureCxx/android/src/main/jni/CMakeLists.txt',
      cxxModuleHeaderName: 'PureCxxModule.h',
      isPureCxxDependency: true,
      packageImportPath: null,
      packageInstance: null,
    });
  });

  it('returns `null` if manifest file has not been found', () => {
    expect(getDependencyConfig('/empty', userConfig)).toBeNull();
  });

  it('returns `null` if android project was not found', () => {
    expect(getDependencyConfig('/empty', userConfig)).toBeNull();
  });

  it('returns `null` if android project does not contain ReactPackage', () => {
    expect(getDependencyConfig('/noPackage', userConfig)).toBeNull();
  });

  it('returns `null` if it cannot find a packageClassName', () => {
    expect(getDependencyConfig('/corrupted', userConfig)).toBeNull();
  });
});
