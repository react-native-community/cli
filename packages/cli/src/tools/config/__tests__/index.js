/**
 * @flow
 */

import loadConfig from '../';

import {
  cleanup,
  writeFiles,
  getTempDirectory,
} from '../../../../../../e2e/helpers';

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
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ios/HelloWorld.xcodeproj/project.pbxproj':
      '',
    'package.json': `{
      "dependencies": {
        "react-native-test": "0.0.1"
      },
      "react-native": {
        "reactNativePath": "."
      }
    }`,
  });
  const config = loadConfig(DIR);
  expect(removeString(config, DIR)).toMatchSnapshot();
});

test('should read a config of a dependency and use it to load other settings', () => {
  writeFiles(DIR, {
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
        "react-native-test": "0.0.1"
      },
      "react-native": {
        "reactNativePath": "."
      }
    }`,
  });
  const config = loadConfig(DIR);
  expect(removeString(config, DIR)).toMatchSnapshot();
});

test('should deep merge project configuration with default values', () => {
  writeFiles(DIR, {
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ios/HelloWorld.xcodeproj/project.pbxproj':
      '',
    'package.json': `{
      "dependencies": {
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
            }
          }
        }
      }
    }`,
  });
  const config = loadConfig(DIR);
  expect(removeString(config, DIR)).toMatchSnapshot();
});
