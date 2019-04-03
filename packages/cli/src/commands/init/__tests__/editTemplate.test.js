// @flow
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import snapshotDiff from 'snapshot-diff';
import walk from '../../../tools/walk';
import copyFiles from '../../../tools/copyFiles';
import {changePlaceholderInTemplate} from '../editTemplate';

const FIXTURE_DIR = path.resolve(
  __dirname,
  '..',
  '__fixtures__',
  'editTemplate',
);
const PLACEHOLDER_NAME = 'PlaceholderName';
const PROJECT_NAME = 'ProjectName';

function createTestEnv() {
  const TEST_DIR = `rncli-should-edit-template-${Date.now()}`;
  const tmpDir = os.tmpdir();
  const testPath = path.resolve(tmpDir, TEST_DIR);

  fs.mkdirSync(testPath);
  copyFiles(FIXTURE_DIR, testPath);

  return testPath;
}

test('should edit template', () => {
  const testPath = createTestEnv();

  jest.spyOn(process, 'cwd').mockImplementation(() => testPath);

  changePlaceholderInTemplate(PROJECT_NAME, PLACEHOLDER_NAME);

  const transformedTree = walk(testPath).map(e => e.replace(testPath, ''));
  const fixtureTree = walk(FIXTURE_DIR).map(e => e.replace(FIXTURE_DIR, ''));

  const oldJavaFile = fs.readFileSync(
    path.resolve(
      FIXTURE_DIR,
      'android',
      'com',
      PLACEHOLDER_NAME.toLowerCase(),
      'Main.java',
    ),
    'utf8',
  );
  const newJavaFile = fs.readFileSync(
    path.resolve(
      testPath,
      'android',
      'com',
      PROJECT_NAME.toLowerCase(),
      'Main.java',
    ),
    'utf8',
  );

  const oldCFile = fs.readFileSync(
    path.resolve(FIXTURE_DIR, 'ios', PLACEHOLDER_NAME, 'AppDelegate.m'),
    'utf8',
  );
  const newCFile = fs.readFileSync(
    path.resolve(testPath, 'ios', PROJECT_NAME, 'AppDelegate.m'),
    'utf8',
  );

  expect(snapshotDiff(oldCFile, newCFile, {contextLines: 1})).toMatchSnapshot();
  expect(
    snapshotDiff(oldJavaFile, newJavaFile, {contextLines: 1}),
  ).toMatchSnapshot();
  expect(
    snapshotDiff(fixtureTree, transformedTree, {contextLines: 1}),
  ).toMatchSnapshot();

  fs.removeSync(testPath);
});
