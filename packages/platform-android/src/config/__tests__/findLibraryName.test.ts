/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {findLibraryName} from '../findLibraryName';
import * as mocks from '../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

const buildGradleWithSingleQuotes = `
  apply plugin: "com.android.application"
  apply plugin: "com.facebook.react"

  react {
    libraryName = 'justalibrary'
  }
  `;

const buildGradleKts = `
  apply(id = "com.android.application")
  apply(id = "com.facebook.react")

  react {
    libraryName.set("justalibrary")
  }
  `;

const packageJsonWithCodegenConfig = `
  {
    "name": "my-awesome-library",
    "version": "0.0.1",
    "codegenConfig": {
      "name": "my-awesome-library"
    }
  }
  `;

const packageJsonWithoutCodegenConfig = `
  {
    "name": "my-awesome-library",
    "version": "0.0.1"
  }
  `;

describe('android::findLibraryName', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      valid: {
        android: mocks.valid,
        singlequotes: {
          'build.gradle': buildGradleWithSingleQuotes,
        },
        gradlekts: {
          'build.gradle.kts': buildGradleKts,
        },
        withcodegenconfig: {
          'package.json': packageJsonWithCodegenConfig,
          android: {
            'build.gradle': buildGradleWithSingleQuotes,
          },
        },
        withoutcodegenconfig: {
          'package.json': packageJsonWithoutCodegenConfig,
          android: {
            'build.gradle': buildGradleWithSingleQuotes,
          },
        },
      },
    });
  });

  it('returns the library name if declared in the build.gradle file', () => {
    expect(findLibraryName('/', '/valid/android')).toBe('justalibrary');
  });

  it('returns the library name if declared with single quotes in the build.gradle file', () => {
    expect(findLibraryName('/', '/valid/singlequotes')).toBe('justalibrary');
  });

  it('returns the library name if declared with inside a build.gradle.kts file', () => {
    expect(findLibraryName('/', '/valid/singlequotes')).toBe('justalibrary');
  });

  it('returns the library name if defined inside codegenConfig', () => {
    expect(
      findLibraryName(
        '/valid/withcodegenconfig',
        '/valid/withcodegenconfig/android',
      ),
    ).toBe('my-awesome-library');
  });

  it('falls back to reading from build.gradle when codegenConfig is not there', () => {
    expect(
      findLibraryName(
        '/valid/withoutcodegenconfig',
        '/valid/withoutcodegenconfig/android',
      ),
    ).toBe('justalibrary');
  });

  it('returns null if there is no build.gradle file', () => {
    expect(findLibraryName('/', '/empty')).toBeUndefined();
  });
});
