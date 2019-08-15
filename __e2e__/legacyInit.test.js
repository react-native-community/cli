// @flow
import fs from 'fs';
import path from 'path';
import execa from 'execa';
import {getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('command-legacy-init');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('legacy init through react-native-cli', () => {
  const templateFiles = [
    '.buckconfig',
    '.eslintrc.js',
    '.flowconfig',
    '.gitattributes',
    '.gitignore',
    '.prettierrc.js',
    '.watchmanconfig',
    'App.js',
    '__tests__',
    'android',
    'app.json',
    'babel.config.js',
    'index.js',
    'ios',
    'metro.config.js',
    'node_modules',
    'package.json',
    'yarn.lock',
  ];
  const {stdout} = execa.sync('npx', ['react-native-cli', 'init', 'TestApp'], {
    cwd: DIR,
  });

  expect(stdout).toContain('Run instructions');

  // make sure we don't leave garbage
  expect(fs.readdirSync(DIR)).toEqual(['TestApp']);

  let dirFiles = fs.readdirSync(path.join(DIR, 'TestApp'));
  expect(dirFiles.length).toEqual(templateFiles.length);

  for (const templateFile of templateFiles) {
    expect(dirFiles.includes(templateFile)).toBe(true);
  }

  const pkgJson = require(path.join(DIR, 'TestApp', 'package.json'));
  expect(pkgJson).toMatchObject({
    dependencies: {
      react: expect.any(String),
      'react-native': expect.any(String),
    },
    devDependencies: {
      '@babel/core': expect.any(String),
      '@babel/runtime': expect.any(String),
      'babel-jest': expect.any(String),
      jest: expect.any(String),
      'metro-react-native-babel-preset': expect.any(String),
      'react-test-renderer': expect.any(String),
    },
    jest: {
      preset: 'react-native',
    },
    name: 'TestApp',
    private: true,
    scripts: {
      start: 'react-native start',
      test: 'jest',
    },
  });
});
