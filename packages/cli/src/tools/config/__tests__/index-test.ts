import path from 'path';
import slash from 'slash';
import loadConfig from '..';
import {logger} from '@react-native-community/cli-tools';
import {
  cleanup,
  writeFiles,
  getTempDirectory,
} from '../../../../../../jest/helpers';

jest.mock('../resolveNodeModuleDir');

const DIR = getTempDirectory('resolve_config_path_test');

const iosPath = slash(
  require.resolve('@react-native-community/cli-platform-ios'),
);
const androidPath = slash(
  require.resolve('@react-native-community/cli-platform-android'),
);

const REACT_NATIVE_MOCK = {
  'node_modules/react-native/package.json': '{}',
  'node_modules/react-native/react-native.config.js': `
    const ios = require("${iosPath}");
    const android = require("${androidPath}");
    module.exports = {
      platforms: {
        ios: {
          linkConfig: ios.linkConfig,
          projectConfig: ios.projectConfig,
          dependencyConfig: ios.dependencyConfig,
        },
        android: {
          linkConfig: android.linkConfig,
          projectConfig: android.projectConfig,
          dependencyConfig: android.dependencyConfig,
        },
      },
    };
  `,
};

// Removes string from all key/values within an object
const removeString = (config, str) =>
  JSON.parse(
    JSON.stringify(config, (_key, value) =>
      typeof value === 'string'
        ? slash(value.replace(str, '<<REPLACED>>'))
        : value,
    ),
  );

beforeEach(() => {
  cleanup(DIR);
  jest.resetModules();
  jest.clearAllMocks();
});

afterEach(() => cleanup(DIR));

test('should have a valid structure by default', () => {
  writeFiles(DIR, {
    'react-native.config.js': `module.exports = {
      reactNativePath: "."
    }`,
  });
  const config = loadConfig(DIR);
  expect(removeString(config, DIR)).toMatchSnapshot();
});

test('should return dependencies from package.json', () => {
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ios/HelloWorld.xcodeproj/project.pbxproj':
      '',
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1",
        "react-native-test": "0.0.1"
      }
    }`,
  });
  const {dependencies} = loadConfig(DIR);
  expect(removeString(dependencies, DIR)).toMatchSnapshot();
});

test('should read a config of a dependency and use it to load other settings', () => {
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ReactNativeTest.podspec': '',
    'node_modules/react-native-test/react-native.config.js': `module.exports = {
      dependency: {
        platforms: {
          ios: {
            project: "./customLocation/customProject.xcodeproj"
          }
        }
      }
    }`,
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1",
        "react-native-test": "0.0.1"
      }
    }`,
  });
  const {dependencies} = loadConfig(DIR);
  expect(
    removeString(dependencies['react-native-test'], DIR),
  ).toMatchSnapshot();
});

test('should merge project configuration with default values', () => {
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/react-native.config.js': `module.exports = {
      dependency: {
        assets: ["foo", "baz"]
      }
    }`,
    'node_modules/react-native-test/ios/HelloWorld.xcodeproj/project.pbxproj':
      '',
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1",
        "react-native-test": "0.0.1"
      }
    }`,
    'react-native.config.js': `module.exports = {
      reactNativePath: ".",
      dependencies: {
        "react-native-test": {
          platforms: {
            ios: {
              sourceDir: "./abc"
            }
          },
          assets: ["foo"]
        }
      }
    }`,
  });
  const {dependencies} = loadConfig(DIR);
  expect(removeString(dependencies['react-native-test'], DIR)).toMatchSnapshot(
    'snapshoting `react-native-test` config',
  );
});

test('should load commands from "react-native-foo" and "react-native-bar" packages', () => {
  writeFiles(DIR, {
    'node_modules/react-native-foo/package.json': '{}',
    'node_modules/react-native-foo/react-native.config.js': `module.exports = {
      commands: [
        {
          name: 'foo-command',
          func: () => console.log('foo')
        }
      ]
    }`,
    'node_modules/react-native-bar/package.json': '{}',
    'node_modules/react-native-bar/react-native.config.js': `module.exports = {
      commands: [
        {
          name: 'bar-command',
          func: () => console.log('bar')
        }
      ]
    }`,
    'package.json': `{
      "dependencies": {
        "react-native-foo": "0.0.1",
        "react-native-bar": "0.0.1"
      }
    }`,
  });
  const {commands} = loadConfig(DIR);
  expect(commands).toMatchSnapshot();
});

// @todo: figure out why this test is so flaky
// eslint-disable-next-line jest/no-disabled-tests
test.skip('should skip packages that have invalid configuration', () => {
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
    'node_modules/react-native/react-native.config.js': `module.exports = {
      dependency: {
        invalidProperty: 5
      }
    }`,
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1"
      }
    }`,
  });
  const spy = jest.spyOn(logger, 'warn');
  const {dependencies} = loadConfig(DIR);
  expect(dependencies).toMatchSnapshot('dependencies config');
  expect(spy.mock.calls[0][0]).toMatchSnapshot('logged warning');
});

test('does not use restricted "react-native" key to resolve config from package.json', () => {
  writeFiles(DIR, {
    'node_modules/react-native-netinfo/package.json': `{
      "react-native": "src/index.js"
    }`,
    'package.json': `{
      "dependencies": {
        "react-native-netinfo": "0.0.1"
      }
    }`,
  });
  const spy = jest.spyOn(logger, 'warn');
  const {dependencies} = loadConfig(DIR);
  expect(dependencies).toHaveProperty('react-native-netinfo');
  expect(spy).not.toHaveBeenCalled();
});

test('supports dependencies from user configuration with custom root and properties', () => {
  const escapePathSeparator = (value: string) =>
    path.sep === '\\' ? value.replace(/(\/|\\)/g, '\\\\') : value;

  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'native-libs/local-lib/ios/LocalRNLibrary.xcodeproj/project.pbxproj': '',
    'react-native.config.js': `
const path = require('path');
const root = path.resolve('${escapePathSeparator(
      DIR,
    )}', 'native-libs', 'local-lib');

module.exports = {
  dependencies: {
    'local-lib': {
      root,
      platforms: {
        ios: {
          podspecPath: "custom-path"
        }
      }
    },
  }
}`,
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1"
      }
    }`,
  });

  const {dependencies} = loadConfig(DIR);
  expect(removeString(dependencies['local-lib'], DIR)).toMatchInlineSnapshot(`
    Object {
      "assets": Array [],
      "hooks": Object {},
      "name": "local-lib",
      "params": Array [],
      "platforms": Object {
        "android": null,
        "ios": Object {
          "folder": "<<REPLACED>>/native-libs/local-lib",
          "libraryFolder": "Libraries",
          "pbxprojPath": "<<REPLACED>>/native-libs/local-lib/ios/LocalRNLibrary.xcodeproj/project.pbxproj",
          "plist": Array [],
          "podfile": null,
          "podspecPath": "custom-path",
          "projectName": "LocalRNLibrary.xcodeproj",
          "projectPath": "<<REPLACED>>/native-libs/local-lib/ios/LocalRNLibrary.xcodeproj",
          "scriptPhases": Array [],
          "sharedLibraries": Array [],
          "sourceDir": "<<REPLACED>>/native-libs/local-lib/ios",
        },
      },
      "root": "<<REPLACED>>/native-libs/local-lib",
    }
  `);
});
