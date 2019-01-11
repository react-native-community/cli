/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

jest.mock('chalk', () => ({ grey: str => str }));
jest.mock('npmlog');

const context = {
  root: process.cwd(),
};

describe('link', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should reject when run in a folder without package.json', done => {
    const link = require('../link').func;
    link([], { root: '/' }, {}).catch(() => done());
  });

  it('should accept a name of a dependency to link', done => {
    const getDependencyConfig = jest.fn(() => ({
      config: {
        ios: null,
        android: null,
      },
      assets: [],
      commands: {},
    }));

    jest.doMock('../getDependencyConfig', () => getDependencyConfig);

    const link = require('../link').func;
    link(['react-native-gradient'], context, {}).then(() => {
      expect(getDependencyConfig.mock.calls[0][2]).toEqual(
        'react-native-gradient'
      );
      done();
    });
  });

  it('should accept the name of a dependency with a scope / tag', async () => {
    const getDependencyConfig = jest.fn(() => ({
      config: {
        ios: null,
        android: null,
      },
      assets: [],
      commands: {},
    }));

    jest.doMock('../getDependencyConfig', () => getDependencyConfig);

    const link = require('../link').func;
    await link(['@scope/something@latest'], context, {});

    expect(getDependencyConfig.mock.calls[0][2]).toEqual('@scope/something');
  });

  it('should register native module when android/ios projects are present', done => {
    const prelink = jest.fn().mockImplementation(cb => cb());
    const postlink = jest.fn().mockImplementation(cb => cb());

    jest.doMock('../getProjectConfig', () => () => ({
      ios: {},
      android: {},
    }));

    const getDependencyConfig = jest.fn(() => ({
      config: {
        ios: {},
        android: {},
      },
      assets: [],
      commands: { prelink, postlink },
    }));

    jest.doMock('../getDependencyConfig', () => getDependencyConfig);

    const registerNativeModule = jest.fn();

    jest.doMock('../android/isInstalled.js', () =>
      jest.fn().mockReturnValue(false)
    );
    jest.doMock(
      '../android/registerNativeModule.js',
      () => registerNativeModule
    );

    jest.doMock('../ios/isInstalled.js', () =>
      jest.fn().mockReturnValue(false)
    );
    jest.doMock('../ios/registerNativeModule.js', () => registerNativeModule);

    const link = require('../link').func;

    link(['react-native-blur'], context, {}).then(() => {
      expect(registerNativeModule.mock.calls).toHaveLength(2);

      expect(prelink.mock.invocationCallOrder[0]).toBeLessThan(
        registerNativeModule.mock.invocationCallOrder[0]
      );

      expect(postlink.mock.invocationCallOrder[0]).toBeGreaterThan(
        registerNativeModule.mock.invocationCallOrder[0]
      );

      done();
    });
  });

  it('should copy assets only from the specific dependency that we are linking', done => {
    const dependencyAssets = ['Fonts/Font.ttf'];
    const projectAssets = ['Fonts/FontC.ttf'];

    jest.doMock('../getProjectConfig', () => () => ({
      ios: {},
      android: {},
    }));

    jest.doMock('../getDependencyConfig', () => () => ({
      config: {
        ios: {},
        android: {},
      },
      assets: dependencyAssets,
      commands: {},
    }));

    jest.doMock('../android/isInstalled.js', () =>
      jest.fn().mockReturnValue(false)
    );
    jest.doMock('../android/registerNativeModule.js', () => jest.fn());

    jest.doMock('../ios/isInstalled.js', () =>
      jest.fn().mockReturnValue(false)
    );
    jest.doMock('../ios/registerNativeModule.js', () => jest.fn());

    jest.doMock('../../core/getAssets', () => projectAssets);

    const copyAssets = jest.fn();

    jest.doMock('../ios/copyAssets.js', () => copyAssets);
    jest.doMock('../android/copyAssets.js', () => copyAssets);

    const link = require('../link').func;

    link(['react-native-blur'], context, {}).then(() => {
      expect(copyAssets.mock.calls).toHaveLength(2);
      expect(copyAssets.mock.calls[0][0]).toEqual(dependencyAssets);
      jest.unmock('../../core/getAssets');
      done();
    });
  });

  it('should not register modules when they are already installed', done => {
    jest.doMock('../getProjectConfig', () => () => ({
      ios: {},
      android: {},
    }));

    const getDependencyConfig = jest.fn(() => ({
      config: {
        ios: {},
        android: {},
      },
      assets: [],
      commands: {},
    }));

    jest.doMock('../getDependencyConfig', () => getDependencyConfig);

    const registerNativeModule = jest.fn();

    jest.doMock('../android/isInstalled.js', () =>
      jest.fn().mockReturnValue(true)
    );
    jest.doMock(
      '../android/registerNativeModule.js',
      () => registerNativeModule
    );

    jest.doMock('../ios/isInstalled.js', () => jest.fn().mockReturnValue(true));
    jest.doMock('../ios/registerNativeModule.js', () => registerNativeModule);

    const link = require('../link').func;

    link(['react-native-blur', {}], context, {}).then(() => {
      expect(registerNativeModule.mock.calls).toHaveLength(0);
      done();
    });
  });

  it('should register native modules for additional platforms', done => {
    jest.doMock('../getProjectConfig', () => () => ({
      ios: {},
      android: {},
      windows: {},
    }));

    const registerNativeModule = jest.fn();

    const genericLinkConfig = () => ({
      isInstalled: () => false,
      register: registerNativeModule,
    });

    const getDependencyConfig = jest.fn(() => ({
      config: {
        ios: {},
        android: {},
        windows: {},
      },
      assets: [],
      commands: {},
    }));

    jest.doMock('../../core/getPlatforms', () => () => ({
      ios: { linkConfig: require('../ios') },
      android: { linkConfig: require('../android') },
      windows: { linkConfig: genericLinkConfig },
    }));

    jest.doMock('../getDependencyConfig', () => getDependencyConfig);

    jest.doMock('../android/isInstalled.js', () =>
      jest.fn().mockReturnValue(true)
    );
    jest.doMock(
      '../android/registerNativeModule.js',
      () => registerNativeModule
    );

    jest.doMock('../ios/isInstalled.js', () => jest.fn().mockReturnValue(true));
    jest.doMock('../ios/registerNativeModule.js', () => registerNativeModule);

    const link = require('../link').func;

    link(['react-native-blur'], context, {}).then(() => {
      expect(registerNativeModule.mock.calls).toHaveLength(1);
      done();
    });
  });

  it('should link only for specific platforms if --platforms is used', async () => {
    jest.doMock('../getProjectDependencies', () => () => ['react-native-maps']);
    jest.doMock('../../core/getPackageConfiguration', () => () => ({
      assets: [],
    }));

    const registerAndroidNativeModule = jest.fn();
    const registerIOSNativeModule = jest.fn();

    const genericAndroidLinkConfig = () => ({
      isInstalled: () => false,
      register: registerAndroidNativeModule,
    });

    const genericIOSLinkConfig = () => ({
      isInstalled: () => false,
      register: registerIOSNativeModule,
    });

    jest.doMock('../../core/getPlatforms', () => () => ({
      android: { linkConfig: genericAndroidLinkConfig },
      ios: { linkConfig: genericIOSLinkConfig },
    }));

    jest.doMock(
      '../android/registerNativeModule.js',
      () => registerAndroidNativeModule
    );
    jest.doMock(
      '../ios/registerNativeModule.js',
      () => registerIOSNativeModule
    );

    const link = require('../link').func;
    const assertPlaftormsCalledTimes = (android, ios) => {
      expect(registerAndroidNativeModule).toHaveBeenCalledTimes(android);
      expect(registerIOSNativeModule).toHaveBeenCalledTimes(ios);
      registerAndroidNativeModule.mockClear();
      registerIOSNativeModule.mockClear();
    };

    await link(
      ['react-native-gradient'],
      { root: '/' },
      { platforms: ['android'] }
    );
    assertPlaftormsCalledTimes(1, 0);

    await link(
      ['react-native-gradient'],
      { root: '/' },
      { platforms: ['ios'] }
    );
    assertPlaftormsCalledTimes(0, 1);

    await link(
      ['react-native-gradient'],
      { root: '/' },
      { platforms: ['android', 'ios'] }
    );
    assertPlaftormsCalledTimes(1, 1);
  });
});
