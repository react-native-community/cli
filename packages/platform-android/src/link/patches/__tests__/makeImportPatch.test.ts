/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import makeImportPatch from '../makeImportPatch';

const packageImportPath = 'import some.example.project';

describe('makeImportPatch', () => {
  it('should build a patch', () => {
    // @ts-ignore
    expect(Object.prototype.toString(makeImportPatch(packageImportPath))).toBe(
      '[object Object]',
    );
  });

  it('MainActivity contains a correct import patch', () => {
    const {patch} = makeImportPatch(packageImportPath);

    expect(patch).toBe(`\n${packageImportPath}`);
  });
});
