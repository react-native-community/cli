/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import isInstalled from '../isInstalled';

const path = require('path');

const PODFILES_PATH = path.join(__dirname, '../__fixtures__/');

describe('pods::isInstalled', () => {
  it('returns false if pod is missing', () => {
    const project = {podfile: path.join(PODFILES_PATH, 'PodfileSimple')};
    const podspecName = {podspecPath: '/path/NotExisting'};
    // @ts-ignore FIXME: Improve types
    expect(isInstalled(project, podspecName)).toBe(false);
  });

  it('returns true for existing pod with version number', () => {
    const project = {podfile: path.join(PODFILES_PATH, 'PodfileSimple')};
    const podspecName = {podspecPath: '/path/TestPod.podspec'};
    // @ts-ignore FIXME: Improve types
    expect(isInstalled(project, podspecName)).toBe(true);
  });

  it('returns true for existing pod with path', () => {
    const project = {podfile: path.join(PODFILES_PATH, 'PodfileWithTarget')};
    const podspecName = {podspecPath: '/path/Yoga.podspec'};
    // @ts-ignore FIXME: Improve types
    expect(isInstalled(project, podspecName)).toBe(true);
  });

  it('returns true for existing pod with multiline definition', () => {
    const project = {
      podfile: path.join(PODFILES_PATH, 'PodfileWithFunction'),
    };
    const podspecName = {podspecPath: '/path/React.podspec'};
    // @ts-ignore FIXME: Improve types
    expect(isInstalled(project, podspecName)).toBe(true);
  });
});
