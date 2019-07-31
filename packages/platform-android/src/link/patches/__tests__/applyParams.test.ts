/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import applyParams from '../applyParams';

describe('applyParams', () => {
  it('apply params to the string', () => {
    expect(applyParams('${foo}', {foo: 'foo'} as any, 'react-native')).toEqual(
      'getResources().getString(R.string.reactNative_foo)',
    );
  });

  it('use null if no params provided', () => {
    expect(applyParams('${foo}', {}, 'react-native')).toEqual('null');
  });
});
