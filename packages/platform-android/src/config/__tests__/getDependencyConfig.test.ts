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
    });
  });

  it('returns an object with android project configuration', () => {
    expect(getDependencyConfig('/nested', userConfig)).not.toBeNull();
    expect(typeof getDependencyConfig('/nested', userConfig)).toBe('object');
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
