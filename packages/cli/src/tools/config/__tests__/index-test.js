/**
 * @flow
 */
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

test('should handle deprecated "rnpm" in project root', () => {
  writeFiles(DIR, {
    'package.json': `{
      "rnpm": {
        "assets": ["./fonts"]
      }
    }`,
    'fonts/SampleFont.ttf': '',
  });
  const config = loadConfig(DIR);

  expect(removeString(config, DIR)).toMatchSnapshot('returns valid config');
  expect(logger.warn).toBeCalledWith(
    expect.stringMatching(/Your project is using deprecated/),
  );
});

test('should return dependencies from package.json', () => {
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
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
    'node_modules/react-native/package.json': '{}',
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
    'node_modules/react-native/package.json': '{}',
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

test('should read `rnpm` config from a dependency and transform it to a new format', () => {
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
    'node_modules/react-native-foo/package.json': `{
      "name": "react-native-foo",
      "rnpm": {
        "ios": {
          "project": "./customLocation/customProject.xcodeproj"
        },
        "haste": {
          "platforms": ["dummy"],
          "providesModuleNodeModules": ["react-native-dummy"]
        }
      }
    }`,
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1",
        "react-native-foo": "0.0.1"
      }
    }`,
  });
  const {dependencies, haste} = loadConfig(DIR);
  expect(removeString(dependencies['react-native-foo'], DIR)).toMatchSnapshot(
    'foo config',
  );
  expect(haste).toMatchSnapshot('haste config');
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

test('should load an out-of-tree "windows" platform that ships with a dependency', () => {
  writeFiles(DIR, {
    'node_modules/react-native-windows/platform.js': `
      module.exports = {"windows": {}};
    `,
    'node_modules/react-native-windows/plugin.js': `
      module.exports = [];
    `,
    'node_modules/react-native-windows/package.json': `{
      "name": "react-native-windows",
      "rnpm": {
        "haste": {
          "platforms": [
            "windows"
          ],
          "providesModuleNodeModules": [
            "react-native-windows"
          ]
        },
        "plugin": "./plugin.js",
        "platform": "./platform.js"
      }
    }`,
    'package.json': `{
      "dependencies": {
        "react-native-windows": "0.0.1"
      }
    }`,
  });
  const {haste, platforms} = loadConfig(DIR);
  expect(removeString({haste, platforms}, DIR)).toMatchSnapshot();
});

test('should automatically put "react-native" into haste config', () => {
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1"
      }
    }`,
  });
  const {haste} = loadConfig(DIR);
  expect(haste).toMatchSnapshot();
});

test('should not add default React Native config when one present', () => {
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
    'node_modules/react-native/react-native.config.js': `module.exports = {
      commands: [{
        name: 'test',
        func: () => {},
      }]
    }`,
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1"
      }
    }`,
  });
  const {commands} = loadConfig(DIR);
  expect(commands).toMatchSnapshot();
});

// @todo: figure out why this test is so flaky
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
    'node_modules/react-native/package.json': '{}',
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
