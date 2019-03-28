// @flow
import info from '../info';
import logger from '../../../tools/logger';

jest.mock('../../../tools/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

const ctx = {reactNativePath: '', root: ''};

beforeEach(() => {
  jest.resetAllMocks();
});

test('prints output without arguments', async () => {
  await info.func([], ctx, {});
  expect(logger.info).toHaveBeenCalledWith(
    'Fetching system and libraries information...',
  );
  const output = (logger.log: any).mock.calls[0][0];
  // Checking on output that should be present on all OSes.
  // TODO: move to e2e tests and adjust expectations to include npm packages
  expect(output).toContain('System:');
  expect(output).toContain('Binaries:');
});

test.todo('prints output with --packages');
