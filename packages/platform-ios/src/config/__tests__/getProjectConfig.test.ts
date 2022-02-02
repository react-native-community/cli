/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

const getProjectConfig = require('../').projectConfig;

describe('ios::getProjectConfig', () => {
  const userConfig = {};

  it.skip('returns `null` if Podfile was not found', () => {});

  it.skip(`returns an object with ios project configuration`, () => {});

  it.skip(`returns correct configuration when multiple Podfile are present`, () => {});
});
