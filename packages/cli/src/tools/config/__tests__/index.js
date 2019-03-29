import fs from 'fs';

import loadConfig from '../';

import {
  cleanup,
  writeFiles,
  getTempDirectory,
} from '../../../../../../e2e/helpers';

import projects from '../../__fixtures__/projects';

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
