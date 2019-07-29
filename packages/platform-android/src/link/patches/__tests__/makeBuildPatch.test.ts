/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import makeBuildPatch from '../makeBuildPatch';
import normalizeProjectName from '../normalizeProjectName';
import path from 'path';

const name = 'test';
const scopedName = '@scoped/test';
const normalizedScopedName = normalizeProjectName('@scoped/test');
const buildGradlePath = path.join(
  __dirname,
  '../../__fixtures__/patchedBuild.gradle',
);

describe('makeBuildPatch', () => {
  it('should build a patch function', () => {
    // @ts-ignore
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
      expect(makeBuildPatch(project, buildGradlePath).patch).toBe(
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
