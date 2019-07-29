/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import makePackagePatch from '../makePackagePatch';
import applyParams from '../applyParams';

const packageInstance = "new SomeLibrary(${foo}, ${bar}, 'something')";
const name = 'some-library';
const params: any = {
  foo: 'foo',
  bar: 'bar',
};

describe('makePackagePatch@0.20', () => {
  it('should build a patch', () => {
    const packagePatch = makePackagePatch(packageInstance, params, name);
    // @ts-ignore
    expect(Object.prototype.toString(packagePatch)).toBe('[object Object]');
  });

  it('MainActivity contains a correct 0.20 import patch', () => {
    const {patch} = makePackagePatch(packageInstance, params, name);
    const processedInstance = applyParams(packageInstance, params, name);

    expect(patch).toBe(`,\n            ${processedInstance}`);
  });
});
