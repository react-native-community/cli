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

const getProjectConfig = require('../').projectConfig;

describe('android::getProjectConfig', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      nested: {
        android: {
          app: mocks.valid,
        },
      },
      flat: {
        android: mocks.valid,
      },
      multiple: {
        android: mocks.userConfigManifest,
      },
      noManifest: {
        android: {},
      },
    });
  });

  it("returns `null` if manifest file hasn't been found and userConfig is not defined", () => {
    const userConfig = undefined;
    const folder = '/noManifest';

    expect(getProjectConfig(folder, userConfig)).toBeNull();
  });

  it("returns `null` if manifest file hasn't been found", () => {
    const userConfig = {};
    const folder = '/noManifest';

    expect(getProjectConfig(folder, userConfig)).toBeNull();
  });

  describe('returns an object with android project configuration for', () => {
    it('nested structure', () => {
      const userConfig = {};
      const folder = '/nested';

      const config = getProjectConfig(folder, userConfig);
      expect(config).toMatchObject({
        sourceDir: '/nested/android',
        appName: 'app',
        packageName: 'com.some.example',
        manifestPath: '/nested/android/app/src/AndroidManifest.xml',
      });
    });

    it('flat structure', () => {
      const userConfig = {};
      const folder = '/flat';

      const config = getProjectConfig(folder, userConfig);
      expect(config).toMatchObject({
        sourceDir: '/flat/android',
        appName: '',
        packageName: 'com.some.example',
        manifestPath: '/flat/android/src/AndroidManifest.xml',
      });
    });

    it('multiple', () => {
      const userConfig = {
        manifestPath: 'src/main/AndroidManifest.xml',
      };
      const folder = '/multiple';

      const config = getProjectConfig(folder, userConfig);
      expect(config).toMatchObject({
        sourceDir: '/multiple/android',
        appName: '',
        packageName: 'com.some.example',
        manifestPath: '/multiple/android/src/main/AndroidManifest.xml',
      });
    });
  });

  it('should return `null` if android project was not found', () => {
    const userConfig = {};
    const folder = '/empty';

    expect(getProjectConfig(folder, userConfig)).toBeNull();
  });

  it('should correctly resolve mainFilePath', () => {
    const userConfig = {};
    const folder = '/nested';

    const config = getProjectConfig(folder, userConfig);
    expect(config.mainFilePath).toEqual(
      '/nested/android/app/src/main/java/com/some/example/MainApplication.java',
    );
  });
});
