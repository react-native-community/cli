/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getDependenciesFromPodfileLock from '../getDependenciesFromPodfileLock';

const path = require('path');

const PODFILES_PATH = path.join(__dirname, '../__fixtures__/');

describe('pods::getDependenciesFromPodfileLock', () => {
  it('only parses parts of the lock file that are valid yaml', () => {
    const podfileDeps = getDependenciesFromPodfileLock(
      path.join(PODFILES_PATH, 'PodfileWithInvalidKey.lock'),
    );
    expect(podfileDeps).toEqual(['MyPackage', 'MyOtherPackage']);
  });
});
