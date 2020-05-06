import {func as link} from '../link';
import loadConfig from '../../../tools/config';
import makeHook from '../makeHook';
jest.mock('chalk', () => ({
  grey: jest.fn(),
  bold: jest.fn(),
  dim: {underline: jest.fn()},
}));
jest.mock('../../../tools/config');
jest.mock('../makeHook', () => {
  return jest.fn(() => {
    return jest.fn(() => Promise.resolve());
  });
});

const baseConfig = loadConfig();

const baseDependencyConfig = {
  name: 'react-native-gradient',
  assets: [],
  hooks: {},
  params: [],
  platforms: {ios: {}, android: {}},
};

describe('link', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should accept a name of a dependency to link', async () => {
    const config = {
      ...baseConfig,
      dependencies: {
        get ['react-native-gradient']() {
          return baseDependencyConfig;
        },
      },
    };

    const spy = jest.spyOn(config.dependencies, 'react-native-gradient', 'get');

    await link(['react-native-gradient'], config, {});

    expect(spy).toHaveBeenCalled();
  });

  it('should accept the name of a dependency with a scope / tag', async () => {
    const config = {
      ...baseConfig,
      dependencies: {
        get ['@scope/something']() {
          return baseDependencyConfig;
        },
      },
    };

    const spy = jest.spyOn(config.dependencies, '@scope/something', 'get');

    await link(['@scope/something@latest'], config, {});

    expect(spy).toHaveBeenCalled();
  });

  it('should register native module when android/ios projects are present', async () => {
    const prelink = 'node prelink.js';
    const postlink = 'node postlink.js';
    const registerNativeModule = jest.fn();

    const config = {
      ...baseConfig,
      project: {
        ios: {},
        android: {},
      },
      platforms: {
        ios: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(false),
          }),
        },
        android: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(false),
          }),
        },
      },
      dependencies: {
        'react-native-blur': {
          ...baseDependencyConfig,
          hooks: {prelink, postlink},
        },
      },
    };

    await link(['react-native-blur'], config, {});
    expect(registerNativeModule.mock.calls).toHaveLength(2);
    expect((makeHook as jest.Mock).mock.calls).toEqual([[prelink], [postlink]]);
  });

  it('should copy assets only from the specific dependency that we are linking', done => {
    const dependencyAssets = ['Fonts/Font.ttf'];
    const projectAssets = ['Fonts/FontC.ttf'];

    const copyAssets = jest.fn();
    const dependency = {
      ...baseDependencyConfig,
      assets: dependencyAssets,
    };

    const config = {
      ...baseConfig,
      project: {
        ios: {},
        android: {},
      },
      platforms: {
        ios: {
          linkConfig: () => ({
            register: jest.fn(),
            copyAssets,
            isInstalled: jest.fn().mockReturnValue(false),
          }),
        },
        android: {
          linkConfig: () => ({
            register: jest.fn(),
            copyAssets,
            isInstalled: jest.fn().mockReturnValue(false),
          }),
        },
      },
      dependencies: {
        'react-native-blur': dependency,
      },
      assets: projectAssets,
    };

    link(['react-native-blur'], config, {}).then(() => {
      expect(copyAssets.mock.calls).toHaveLength(2);
      expect(copyAssets.mock.calls[0][0]).toEqual(dependencyAssets);
      done();
    });
  });

  it('should not register modules when they are already installed', done => {
    const registerNativeModule = jest.fn();

    const config = {
      ...baseConfig,
      project: {
        ios: {},
        android: {},
      },
      platforms: {
        ios: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(true),
          }),
        },
        android: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(true),
          }),
        },
      },
      dependencies: {
        'react-native-blur': baseDependencyConfig,
      },
    };

    link(['react-native-blur'], config, {}).then(() => {
      expect(registerNativeModule.mock.calls).toHaveLength(0);
      done();
    });
  });

  it('should register native modules for additional platforms', done => {
    const registerNativeModule = jest.fn();

    const config = {
      ...baseConfig,
      project: {
        ios: {},
        android: {},
        windows: {},
      },
      platforms: {
        ios: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(true),
          }),
        },
        android: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(true),
          }),
        },
        windows: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(false),
          }),
        },
      },
      dependencies: {
        'react-native-blur': {
          ...baseDependencyConfig,
          platforms: {
            ...baseDependencyConfig.platforms,
            windows: {},
          },
        },
      },
    };

    link(['react-native-blur'], config, {}).then(() => {
      expect(registerNativeModule.mock.calls).toHaveLength(1);
      done();
    });
  });

  it('should link only for specific platforms if --platforms is used', async () => {
    const registerNativeModule = jest.fn();

    const config = {
      ...baseConfig,
      project: {
        ios: {},
        android: {},
      },
      platforms: {
        ios: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(false),
          }),
        },
        android: {
          linkConfig: () => ({
            register: registerNativeModule,
            isInstalled: jest.fn().mockReturnValue(false),
          }),
        },
      },
      dependencies: {
        'react-native-blur': baseDependencyConfig,
      },
    };

    await link(['react-native-blur'], config, {platforms: ['android']});

    expect(registerNativeModule.mock.calls).toHaveLength(1);
  });
});
