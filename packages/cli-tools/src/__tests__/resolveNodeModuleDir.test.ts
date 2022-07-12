/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import resolveNodeModuleDir, {
  alternateResolveNodeModuleDir,
} from '../resolveNodeModuleDir';

import packageJson from '../../package.json';

describe('alternateResolveNodeModulesDir', () => {
  it('should be identical to default resolution for this projects dependencies', () => {
    const packages = [
      ...Object.keys(packageJson.dependencies),
      ...Object.keys(packageJson.devDependencies),
    ].filter((a) => !a.match('@react-native-community') && !a.match('@types'));

    packages.forEach((pkg) => {
      const dir = resolveNodeModuleDir(__dirname, pkg);
      const alternateDir = alternateResolveNodeModuleDir(__dirname, pkg);
      expect(dir).toEqual(alternateDir);
    });
  });

  it('should return identical output for package deep file requires', () => {
    const pkgs = [
      'lodash/intersection.js',
      'lodash/package.json',
      'yargs/locales/en.json',
    ];
    pkgs.forEach((pkg) => {
      const dir = resolveNodeModuleDir(__dirname, pkg);
      const alternateDir = alternateResolveNodeModuleDir(__dirname, pkg);
      expect(dir).toEqual(alternateDir);
    });
  });

  it('should blow up for non-existent packages', () => {
    const pkgs = ['blerbqwerzxcqwerv', 'qwerasdfasdfertrr/asdfasdf'];
    pkgs.forEach((pkg) => {
      expect(() => {
        alternateResolveNodeModuleDir(__dirname, pkg);
      }).toThrow();
    });
  });
});
