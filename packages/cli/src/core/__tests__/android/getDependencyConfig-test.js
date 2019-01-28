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

import getDependencyConfig from '../../android';
import { valid, corrupted } from '../../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

const userConfig = {};

describe('android::getDependencyConfig', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      nested: {
        android: {
          app: valid,
        },
      },
      corrupted: {
        android: {
          app: corrupted,
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
