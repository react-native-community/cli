/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import makeSettingsPatch from '../makeSettingsPatch';

const projectConfig = {
  sourceDir: '/home/project/android/app',
  settingsGradlePath: '/home/project/android/settings.gradle',
};

describe('makeSettingsPatch with package "test"', () => {
  const name = 'test';
  const dependencyConfig = {
    sourceDir: `/home/project/node_modules/${name}/android`,
  };

  it('should build a patch function', () => {
    expect(
      makeSettingsPatch(name, dependencyConfig, projectConfig),
    ).toMatchObject({
      pattern: '\n',
      patch: expect.any(String),
    });
  });

  it('includes project with correct path', () => {
    const {patch} = makeSettingsPatch(name, dependencyConfig, projectConfig);

    expect(patch).toMatchInlineSnapshot(`
"include ':test'
project(':test').projectDir = new File(rootProject.projectDir, '../node_modules/test/android')
"
`);
  });

  // Simulate Windows environment on POSIX filesystem
  // TODO: scope this test to Windows-only once we setup CI on Windows
  // as changing path to be windows-specific breaks global path mock
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('includes project with correct path on Windows', () => {
    jest.resetModules();
    jest.doMock('path', () => {
      const path = jest.requireActual('path');
      path.dirname = path.win32.dirname;
      path.relative = path.win32.relative;
      return path;
    });
    // eslint-disable-next-line no-shadow
    const makeSettingsPatch = require('../makeSettingsPatch').default;
    const projectConfigWindows = {
      sourceDir: 'C:\\home\\project\\android\\app',
      settingsGradlePath: 'C:\\home\\project\\android\\settings.gradle',
    };
    const dependencyConfigWindows = {
      sourceDir: `C:\\home\\project\\node_modules\\${name}\\android`,
    };
    const {patch} = makeSettingsPatch(
      name,
      dependencyConfigWindows,
      projectConfigWindows,
    );

    jest.dontMock('path');

    expect(patch).toMatchInlineSnapshot(`
"include ':test'
project(':test').projectDir = new File(rootProject.projectDir, '../node_modules/test/android')
"
`);
  });
});

describe('makeSettingsPatch with scoped package "@scoped/test"', () => {
  const name = '@scoped/test';
  const dependencyConfig = {
    sourceDir: `/home/project/node_modules/${name}/android`,
  };

  it('should build a patch function', () => {
    expect(
      makeSettingsPatch(name, dependencyConfig, projectConfig),
    ).toMatchObject({
      pattern: '\n',
      patch: expect.any(String),
    });
  });

  it('includes project with correct path', () => {
    const {patch} = makeSettingsPatch(name, dependencyConfig, projectConfig);

    expect(patch).toMatchInlineSnapshot(`
"include ':@scoped_test'
project(':@scoped_test').projectDir = new File(rootProject.projectDir, '../node_modules/@scoped/test/android')
"
`);
  });
});
