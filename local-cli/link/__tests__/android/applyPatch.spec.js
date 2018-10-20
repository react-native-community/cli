/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const applyParams = require('../../android/patches/applyParams');

describe('applyParams', () => {
  it('apply params to the string', () => {
    expect(applyParams('${foo}', {foo: 'foo'}, 'react-native')).toEqual(
      'getResources().getString(R.string.reactNative_foo)',
    );
  });

  it('use null if no params provided', () => {
    expect(applyParams('${foo}', {}, 'react-native')).toEqual('null');
  });
});
