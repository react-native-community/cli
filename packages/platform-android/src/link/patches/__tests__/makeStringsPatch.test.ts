/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import makeStringsPatch from '../makeStringsPatch';

describe('makeStringsPatch', () => {
  it('should export a patch with <string> element', () => {
    const params: any = {
      keyA: 'valueA',
    };

    expect(makeStringsPatch(params, 'module').patch).toContain(
      '<string moduleConfig="true" name="module_keyA">valueA</string>',
    );
  });

  it('should export an empty patch if no params given', () => {
    expect(makeStringsPatch({}, 'module').patch).toBe('');
  });
});
