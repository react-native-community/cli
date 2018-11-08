/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

/* eslint-env node */

'use strict';

/* $FlowFixMe: This is a dependency o Metro Babel Register */
const {transformSync: babelTransformSync} = require('@babel/core');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const babelRegisterOnly = require('metro-babel-register');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');

// Get the default transpile configuration from `metro-babel-register`
const config = babelRegisterOnly.config([]);

module.exports = {
  process(src /*:string */, file /*:string */) {
    return babelTransformSync(src, {
      filename: file,
      sourceType: 'script',
      plugins: config.plugins,
      ast: false,
    });
  },
  getCacheKey: createCacheKeyFunction([
    __filename,
    require.resolve('@babel/core/package.json'),
  ]),
};
