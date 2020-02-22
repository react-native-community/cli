import {run, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('command-validations');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('suggests matching command', () => {
  const {stderr} = run(DIR, ['ini'], {expectedFailure: true});
  expect(stderr).toContain(
    'error Unrecognized command "ini". Did you mean "init"?',
  );
});
