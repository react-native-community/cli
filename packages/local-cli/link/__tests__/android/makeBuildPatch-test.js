/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

const makeBuildPatch = require('../../android/patches/makeBuildPatch');
const normalizeProjectName = require('../../android/patches/normalizeProjectName');

const name = 'test';
const scopedName = '@scoped/test';
const normalizedScopedName = normalizeProjectName('@scoped/test');

describe('makeBuildPatch', () => {
  it('should build a patch function', () => {
    expect(Object.prototype.toString(makeBuildPatch(name))).toBe(
      '[object Object]'
    );
  });

  it('should make a correct patch', () => {
    const { patch } = makeBuildPatch(name);
    expect(patch).toBe(`    implementation project(':${name}')\n`);
  });

  it('should make a correct install check pattern', () => {
    const { installPattern } = makeBuildPatch(name);
    expect(installPattern.toString()).toEqual(expect.stringContaining(name));
  });
});

describe('makeBuildPatchWithScopedPackage', () => {
  it('should make a correct patch', () => {
    const { patch } = makeBuildPatch(scopedName);
    expect(patch).toBe(
      `    implementation project(':${normalizedScopedName}')\n`
    );
  });

  it('should make a correct install check pattern', () => {
    const { installPattern } = makeBuildPatch(scopedName);
    expect(installPattern.toString()).toEqual(
      expect.stringContaining(normalizedScopedName)
    );
  });
});
