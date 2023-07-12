/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {projectConfig} from '../index';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

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
    });
  });

  it('returns `null` if Podfile was not found', () => {
    expect(projectConfig('/empty', {})).toBe(null);
  });
  it('returns an object with ios project configuration', () => {
    expect(projectConfig('/flat', {})).toMatchInlineSnapshot(`
      Object {
        "sourceDir": "/flat/ios",
        "watchModeCommandParams": undefined,
        "xcodeProject": null,
      }
    `);
  });
  it('returns correct configuration when multiple Podfile are present', () => {
    expect(projectConfig('/multiple', {})).toMatchInlineSnapshot(`
      Object {
        "sourceDir": "/multiple/ios",
        "watchModeCommandParams": undefined,
        "xcodeProject": null,
      }
    `);
  });
});
