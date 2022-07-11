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
  it('returns `null` if Podfile was not found', () => {
    fs.__setMockFilesystem({});
    expect(projectConfig('/', {})).toBe(null);
  });
  it('returns an object with ios project configuration', () => {
    fs.__setMockFilesystem({
      ios: {
        Podfile: '',
      },
    });
    expect(projectConfig('/', {})).toMatchInlineSnapshot(`
      Object {
        "sourceDir": "/ios",
        "xcodeProject": null,
      }
    `);
  });
  it('returns correct configuration when multiple Podfile are present', () => {
    fs.__setMockFilesystem({
      sample: {
        Podfile: '',
      },
      ios: {
        Podfile: '',
      },
      example: {
        Podfile: '',
      },
    });
    expect(projectConfig('/', {})).toMatchInlineSnapshot(`
      Object {
        "sourceDir": "/ios",
        "xcodeProject": null,
      }
    `);
  });
});
