/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

const log = require('npmlog');

jest.setMock('chalk', { grey: str => str });

const context = {
  root: process.cwd(),
};

describe('link', () => {
  beforeEach(() => {
    jest.resetModules();
    delete require.cache[require.resolve('../link')];
    log.level = 'silent';
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

    jest.setMock('../getDependencyConfig', getDependencyConfig);

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

    jest.setMock('../getDependencyConfig', getDependencyConfig);

    const link = require('../link').func;
    await link(['@scope/something@latest'], context, {});

    expect(getDependencyConfig.mock.calls[0][2]).toEqual('@scope/something');
  });

  it('should register native module when android/ios projects are present', done => {
    const prelink = jest.fn().mockImplementation(cb => cb());
    const postlink = jest.fn().mockImplementation(cb => cb());

    jest.setMock('../getProjectConfig', () => ({
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

    jest.setMock('../getDependencyConfig', getDependencyConfig);

    const registerNativeModule = jest.fn();

    jest.setMock('../android/isInstalled.js', jest.fn().mockReturnValue(false));
    jest.setMock('../android/registerNativeModule.js', registerNativeModule);

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(false));
    jest.setMock('../ios/registerNativeModule.js', registerNativeModule);

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

    jest.setMock('../getProjectConfig', () => ({
      ios: {},
      android: {},
    }));

    jest.setMock('../getDependencyConfig', () => ({
      config: {
        ios: {},
        android: {},
      },
      assets: dependencyAssets,
      commands: {},
    }));

    jest.setMock('../android/isInstalled.js', jest.fn().mockReturnValue(false));
    jest.setMock('../android/registerNativeModule.js', jest.fn());

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(false));
    jest.setMock('../ios/registerNativeModule.js', jest.fn());

    jest.setMock('../../core/getAssets', () => projectAssets);

    const copyAssets = jest.fn();

    jest.setMock('../ios/copyAssets.js', copyAssets);
    jest.setMock('../android/copyAssets.js', copyAssets);

    const link = require('../link').func;

    link(['react-native-blur'], context, {}).then(() => {
      expect(copyAssets.mock.calls).toHaveLength(2);
      expect(copyAssets.mock.calls[0][0]).toEqual(dependencyAssets);
      jest.unmock('../../core/getAssets');
      done();
    });
  });

  it('should not register modules when they are already installed', done => {
    jest.setMock('../getProjectConfig', () => ({
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

    jest.setMock('../getDependencyConfig', getDependencyConfig);

    const registerNativeModule = jest.fn();

    jest.setMock('../android/isInstalled.js', jest.fn().mockReturnValue(true));
    jest.setMock('../android/registerNativeModule.js', registerNativeModule);

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(true));
    jest.setMock('../ios/registerNativeModule.js', registerNativeModule);

    const link = require('../link').func;

    link(['react-native-blur', {}], context, {}).then(() => {
      expect(registerNativeModule.mock.calls).toHaveLength(0);
      done();
    });
  });

  it('should register native modules for additional platforms', done => {
    jest.setMock('../getProjectConfig', () => ({
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

    jest.setMock('../../core/getPlatforms', () => ({
      ios: { linkConfig: require('../ios') },
      android: { linkConfig: require('../android') },
      windows: { linkConfig: genericLinkConfig },
    }));

    jest.setMock('../getDependencyConfig', getDependencyConfig);

    jest.setMock('../android/isInstalled.js', jest.fn().mockReturnValue(true));
    jest.setMock('../android/registerNativeModule.js', registerNativeModule);

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(true));
    jest.setMock('../ios/registerNativeModule.js', registerNativeModule);

    const link = require('../link').func;

    link(['react-native-blur'], context, {}).then(() => {
      expect(registerNativeModule.mock.calls).toHaveLength(1);
      done();
    });
  });

  it('should link only for specific platforms if --platforms is used', async () => {
    jest.setMock('../getProjectDependencies', () => ['react-native-maps']);
    jest.setMock('../../core/getPackageConfiguration', () => ({
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

    jest.setMock('../../core/getPlatforms', () => ({
      android: { linkConfig: genericAndroidLinkConfig },
      ios: { linkConfig: genericIOSLinkConfig },
    }));

    jest.setMock(
      '../android/registerNativeModule.js',
      registerAndroidNativeModule
    );
    jest.setMock('../ios/registerNativeModule.js', registerIOSNativeModule);

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
