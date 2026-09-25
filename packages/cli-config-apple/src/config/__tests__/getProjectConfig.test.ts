/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {getProjectConfig} from '../index';

const projectConfig = getProjectConfig({platformName: 'ios'});

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

const xcodeProject = (extra: Record<string, string> = {}) => ({
  'project.pbxproj': '',
  ...extra,
});

// Written inside the `.xcodeproj` bundle by `react-native spm`.
const spmMarker = {'.spm-injected.json': '{}'};
describe('ios::getProjectConfig', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flat: {
        ios: {
          Podfile: '',
        },
      },
      multiple: {
        sample: {
          Podfile: '',
        },
        ios: {
          Podfile: '',
        },
        example: {
          Podfile: '',
        },
      },
      // Migrated with `react-native spm`, Podfile gone.
      spm: {
        ios: {
          'TestApp.xcodeproj': xcodeProject(spmMarker),
          '.xcode.env': '',
        },
      },
      // `react-native spm` strips React Native from the Podfile but leaves it
      // on disk, so the marker has precedence.
      spmWithLeftoverPodfile: {
        ios: {
          Podfile: '',
          'TestApp.xcodeproj': xcodeProject(spmMarker),
        },
      },
      // Migrated project and leftover Podfile live in different folders.
      spmAndStalePodfile: {
        'TestApp.xcodeproj': xcodeProject(spmMarker),
        ios: {
          Podfile: '',
        },
      },
      noMarker: {
        ios: {
          'TestApp.xcodeproj': xcodeProject(),
          '.xcode.env': '',
        },
      },
      spmOutsidePlatformDir: {
        'TestApp.xcodeproj': xcodeProject(spmMarker),
      },
      customSpmLocation: {
        'ios-dev': {
          'TestApp.xcodeproj': xcodeProject(spmMarker),
        },
        ios: {
          'TestApp.xcodeproj': xcodeProject(),
        },
      },
    });
  });

  it('returns `null` if Podfile was not found', () => {
    expect(projectConfig('/empty', {})).toBe(null);
  });
  it('returns an object with ios project configuration', () => {
    expect(projectConfig('/flat', {})).toMatchInlineSnapshot(`
      Object {
        "assets": Array [],
        "automaticPodsInstallation": undefined,
        "buildSystem": "cocoapods",
        "sourceDir": "/flat/ios",
        "watchModeCommandParams": undefined,
        "xcodeProject": null,
      }
    `);
  });
  it('returns correct configuration when multiple Podfile are present', () => {
    expect(projectConfig('/multiple', {})).toMatchInlineSnapshot(`
      Object {
        "assets": Array [],
        "automaticPodsInstallation": undefined,
        "buildSystem": "cocoapods",
        "sourceDir": "/multiple/ios",
        "watchModeCommandParams": undefined,
        "xcodeProject": null,
      }
    `);
  });
  it('returns project configuration for Swift Package Manager projects without a Podfile', () => {
    expect(projectConfig('/spm', {})).toMatchInlineSnapshot(`
      Object {
        "assets": Array [],
        "automaticPodsInstallation": undefined,
        "buildSystem": "spm",
        "sourceDir": "/spm/ios",
        "watchModeCommandParams": undefined,
        "xcodeProject": Object {
          "isWorkspace": false,
          "name": "TestApp.xcodeproj",
          "path": ".",
        },
      }
    `);
  });
  it('uses the Swift Package Manager project when a Podfile is left behind', () => {
    expect(projectConfig('/spmWithLeftoverPodfile', {})).toMatchObject({
      buildSystem: 'spm',
      sourceDir: '/spmWithLeftoverPodfile/ios',
    });
  });
  it('prefers the migrated project over a Podfile in another folder', () => {
    expect(projectConfig('/spmAndStalePodfile', {})).toMatchObject({
      buildSystem: 'spm',
      sourceDir: '/spmAndStalePodfile',
    });
  });
  it('returns `null` when there is no Podfile and no migrated Xcode project', () => {
    expect(projectConfig('/noMarker', {})).toBe(null);
  });
  it('finds a Swift Package Manager project outside of the platform folder', () => {
    expect(projectConfig('/spmOutsidePlatformDir', {}).sourceDir).toBe(
      '/spmOutsidePlatformDir',
    );
  });
  it('uses project.ios.sourceDir as a search location for Swift Package Manager projects', () => {
    expect(projectConfig('/customSpmLocation', {sourceDir: 'ios-dev'}))
      .toMatchInlineSnapshot(`
      Object {
        "assets": Array [],
        "automaticPodsInstallation": undefined,
        "buildSystem": "spm",
        "sourceDir": "/customSpmLocation/ios-dev",
        "watchModeCommandParams": undefined,
        "xcodeProject": Object {
          "isWorkspace": false,
          "name": "TestApp.xcodeproj",
          "path": ".",
        },
      }
    `);
  });
});
