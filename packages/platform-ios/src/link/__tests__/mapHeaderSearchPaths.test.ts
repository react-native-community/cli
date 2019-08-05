/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import mapHeaderSearchPaths from '../mapHeaderSearchPaths';

const xcode = require('xcode');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../__fixtures__/project.pbxproj'),
);

describe('ios::mapHeaderSearchPaths', () => {
  beforeEach(() => {
    project.parseSync();
  });

  /**
   * Based on the fixtures, our assumption is that this function
   * has to be executed two times.
   */
  it('should be called twice', () => {
    const callback = jest.fn();
    mapHeaderSearchPaths(project, callback);

    expect(callback.mock.calls).toHaveLength(2);
  });

  it('calls the function with an array of paths, given a project with one', () => {
    const callback = jest.fn();
    mapHeaderSearchPaths(project, callback);

    const paths = callback.mock.calls[0][0];

    expect(paths instanceof Array).toBe(true);
    expect(paths).toHaveLength(1);
    expect(paths[0]).toBe('"$(inherited)"');
  });
});
