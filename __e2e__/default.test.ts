import {runCLI, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('test_default_behavior');

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {});
});
afterEach(() => {
  cleanup(DIR);
});

test('shows up help information without passing in any args', () => {
  const {stderr} = runCLI(DIR, [], {expectedFailure: true});
  expect(stderr).toMatchSnapshot();
});

test('does not pass --platform-name by default', () => {
  const {stderr} = runCLI(DIR, [], {expectedFailure: true});
  expect(stderr).not.toContain("unknown option '--platform-name'");
});

test.each(['run-ios', 'build-ios'])(
  'registers --verbose once for %s',
  (command) => {
    writeFiles(DIR, {'package.json': '{}'});
    const {stdout, exitCode} = runCLI(DIR, [command, '--help']);

    expect(exitCode).toBe(0);
    expect(stdout.match(/^\s+--verbose\s+/gm)).toHaveLength(1);
    expect(stdout).toMatch(/Do not use xcbeautify or\s+xcpretty/);
  },
);
