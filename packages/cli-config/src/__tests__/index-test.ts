import path from 'path';
import slash from 'slash';
import loadConfig from '..';
import {cleanup, writeFiles, getTempDirectory} from '../../../../jest/helpers';

let DIR = getTempDirectory('config_test');

jest.dontMock('@react-native-community/cli-tools');

const spy = jest.spyOn(global.console, 'warn').mockImplementation(jest.fn());

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
      // In certain cases, `str` (which is a temporary location) will be `/tmp`
      // which is a symlink to `/private/tmp` on OS X. In this case, tests will fail.
      // Following RegExp makes sure we strip the entire path.
      typeof value === 'string'
        ? slash(value.replace(new RegExp(`(.*)${str}`), '<<REPLACED>>'))
        : value,
    ),
  );

beforeEach(async () => {
  await cleanup(DIR);
  jest.resetModules();
  jest.clearAllMocks();
});

afterEach(async () => await cleanup(DIR));

test('should have a valid structure by default', () => {
  DIR = getTempDirectory('config_test_structure');
  writeFiles(DIR, {
    'react-native.config.js': `module.exports = {
      reactNativePath: "."
    }`,
  });
  const config = loadConfig(DIR);
  expect(removeString(config, DIR)).toMatchSnapshot();
});

test('should return dependencies from package.json', () => {
  DIR = getTempDirectory('config_test_deps');
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ReactNativeTest.podspec': '',
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
  DIR = getTempDirectory('config_test_settings');
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ReactNativeTest.podspec': '',
    'node_modules/react-native-test/react-native.config.js': `module.exports = {
      dependency: {
        platforms: {
          ios: {
            scriptPhases: [
              {
                name: "[TEST] Some Configuration",
                path: "./customLocation/custom.sh",
                execution_position: "after_compile",
                input_files: ["input_file"],
                shell_path: "some/shell/path/bash",
                output_files: ["output_file"],
                input_file_lists: ["input_file_1", "input_file_2"],
                output_file_lists: ["output_file_1", "output_file_2"],
                show_env_vars_in_log: false,
                dependency_file: "/path/to/dependency/file"
              }
            ]
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
  DIR = getTempDirectory('config_test_merge');
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ReactNativeTest.podspec': '',
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
              scriptPhases: [{name: "abc", path: "./phase.sh"}]
            }
          },
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
  DIR = getTempDirectory('config_test_packages');
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

test('should skip packages that have invalid configuration', () => {
  process.env.FORCE_COLOR = '0'; // To disable chalk
  DIR = getTempDirectory('config_test_skip');
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
  const {dependencies} = loadConfig(DIR);
  expect(dependencies).toMatchSnapshot('dependencies config');
  expect(spy.mock.calls[0][0]).toMatchSnapshot('logged warning');
});

test('does not use restricted "react-native" key to resolve config from package.json', () => {
  DIR = getTempDirectory('config_test_restricted');
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
  const {dependencies} = loadConfig(DIR);
  expect(dependencies).toHaveProperty('react-native-netinfo');
  expect(spy).not.toHaveBeenCalled();
});

test('supports dependencies from user configuration with custom root and properties', () => {
  DIR = getTempDirectory('config_test_custom_root');
  const escapePathSeparator = (value: string) =>
    path.sep === '\\' ? value.replace(/(\/|\\)/g, '\\\\') : value;

  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'native-libs/local-lib/LocalRNLibrary.podspec': '',
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
      "name": "local-lib",
      "platforms": Object {
        "android": null,
        "ios": Object {
          "configurations": Array [],
          "podspecPath": "custom-path",
          "scriptPhases": Array [],
        },
      },
      "root": "<<REPLACED>>/native-libs/local-lib",
    }
  `);
});

test('should apply build types from dependency config', () => {
  DIR = getTempDirectory('config_test_apply_dependency_config');
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ReactNativeTest.podspec': '',
    'node_modules/react-native-test/react-native.config.js': `module.exports = {
      dependency: {
        platforms: {
          ios: {
            configurations: ["debug"]
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

test('supports dependencies from user configuration with custom build type', () => {
  DIR = getTempDirectory('config_test_apply_custom_build_config');
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'react-native.config.js': `module.exports = {
  dependencies: {
    'react-native-test': {
      platforms: {
        ios: {
          configurations: ["custom_build_type"]
        }
      }
    },
  }
}`,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ReactNativeTest.podspec': '',
    'node_modules/react-native-test/react-native.config.js':
      'module.exports = {}',
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

test('supports disabling dependency for ios platform', () => {
  DIR = getTempDirectory('config_test_disable_dependency_platform');
  writeFiles(DIR, {
    ...REACT_NATIVE_MOCK,
    'node_modules/react-native-test/package.json': '{}',
    'node_modules/react-native-test/ReactNativeTest.podspec': '',
    'node_modules/react-native-test/react-native.config.js': `
      module.exports = {
        dependency: {
          platforms: {
            ios: null
          }
        }
      }
    `,
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
