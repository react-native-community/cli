/**
 * @flow
 */

import loadConfig from '..';

import {
  cleanup,
  writeFiles,
  getTempDirectory,
} from '../../../../../../jest/helpers';

import {logger} from '@react-native-community/cli-tools';

const DIR = getTempDirectory('resolve_config_path_test');

// Removes string from all key/values within an object
const removeString = (config, str) =>
  JSON.parse(
    JSON.stringify(config).replace(new RegExp(str, 'g'), '<<REPLACED>>'),
  );

beforeEach(() => {
  cleanup(DIR);
  jest.resetModules();
});

afterEach(() => cleanup(DIR));

test('should have a valid structure by default', () => {
  writeFiles(DIR, {
    'package.json': `{
      "react-native": {
        "reactNativePath": "."
      }
    }`,
  });
  const config = loadConfig(DIR);
  expect(removeString(config, DIR)).toMatchSnapshot();
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
    'node_modules/react-native-test/package.json': `{
      "react-native": {
        "dependency": {
          "platforms": {
            "ios": {
              "project": "./customLocation/customProject.xcodeproj"
            }
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
    'node_modules/react-native-test/package.json': `{
      "react-native": {
        "dependency": {
          "assets": ["foo", "baz"]
        }
      }
    }`,
    'node_modules/react-native-test/ios/HelloWorld.xcodeproj/project.pbxproj':
      '',
    'package.json': `{
      "dependencies": {
        "react-native": "0.0.1",
        "react-native-test": "0.0.1"
      },
      "react-native": {
        "reactNativePath": ".",
        "dependencies": {
          "react-native-test": {
            "platforms": {
              "ios": {
                "sourceDir": "./abc"
              }
            },
            "assets": ["foo"]
          }
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
  const {dependencies} = loadConfig(DIR);
  expect(removeString(dependencies['react-native-foo'], DIR)).toMatchSnapshot();
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

test('should skip packages that have invalid configuration', () => {
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
    'node_modules/react-native/react-native.config.js': `module.exports = {
      invalidProperty: 5
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
