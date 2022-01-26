import path from 'path';
import findProjectRoot from '../findProjectRoot';
import {cleanup, writeFiles, getTempDirectory} from '../../../../jest/helpers';

beforeEach(async () => {
  await cleanup(DIR);
  jest.resetModules();
});

afterEach(async () => await cleanup(DIR));

const DIR = getTempDirectory('find_project_root_test');

test('resolves to correct project root', () => {
  writeFiles(DIR, {
    'package.json': '{}',
    'ios/Podfile': '',
  });
  const cwd = path.join(DIR, 'ios');
  expect(findProjectRoot(cwd)).toBe(DIR);
  expect(findProjectRoot(DIR)).toBe(DIR);
});

test('resolves to correct project root in a monorepo', () => {
  writeFiles(DIR, {
    'package.json': '{}',
    'packages/mobile/package.json': '{}',
    'packages/mobile/ios/Podfile': '',
  });
  const cwd = path.join(DIR, 'packages/mobile/ios');
  expect(findProjectRoot(cwd)).toBe(path.join(DIR, 'packages/mobile'));
});
