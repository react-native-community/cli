/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

import makeBuildPatch from '../../android/patches/makeBuildPatch';
import normalizeProjectName from '../../android/patches/normalizeProjectName';
import path from 'path';

const projectConfig = {
  buildGradlePath: path.join(
    __dirname,
    '../../__fixtures__/android/patchedBuild.gradle',
  ),
};

const name = 'test';
const scopedName = '@scoped/test';
const normalizedScopedName = normalizeProjectName('@scoped/test');

describe('makeBuildPatch', () => {
  it('should build a patch function', () => {
    expect(Object.prototype.toString(makeBuildPatch(name))).toBe(
      '[object Object]',
    );
  });

  it('should make a correct patch', () => {
    const {patch} = makeBuildPatch(name);
    expect(patch).toBe(`    implementation project(':${name}')\n`);
  });

  it('should make a correct install check pattern', () => {
    const {installPattern} = makeBuildPatch(name);
    expect(installPattern.toString()).toEqual(expect.stringContaining(name));
  });

  test.each([
    ['test-impl', "    implementation project(':test-impl')\n"],
    ['test-compile', "    compile project(':test-compile')\n"],
    ['test-api', "    api project(':test-api')\n"],
    [
      'test-not-there-yet',
      "    implementation project(':test-not-there-yet')\n",
    ],
  ])(
    'properly detects the patch string of project %p in build.gradle',
    (project, projectPatchString) => {
      expect(makeBuildPatch(project, projectConfig.buildGradlePath).patch).toBe(
        projectPatchString,
      );
    },
  );
});

describe('makeBuildPatchWithScopedPackage', () => {
  it('should make a correct patch', () => {
    const {patch} = makeBuildPatch(scopedName);
    expect(patch).toBe(
      `    implementation project(':${normalizedScopedName}')\n`,
    );
  });

  it('should make a correct install check pattern', () => {
    const {installPattern} = makeBuildPatch(scopedName);
    expect(installPattern.toString()).toEqual(
      expect.stringContaining(normalizedScopedName),
    );
  });
});
