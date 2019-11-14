import info from '../info';
import {logger} from '@react-native-community/cli-tools';
import loadConfig from '../../../tools/config';

jest.mock('../../../tools/config');

beforeEach(() => {
  jest.resetAllMocks();
});

const config = loadConfig();

test('prints output without arguments', async () => {
  await info.func([], config);
  expect(logger.info).toHaveBeenCalledWith(
    'Fetching system and libraries information...',
  );
  const output = (logger.log as jest.Mock).mock.calls[0][0];
  // Checking on output that should be present on all OSes.
  // TODO: move to e2e tests and adjust expectations to include npm packages
  expect(output).toContain('System:');
  expect(output).toContain('Binaries:');
}, 20000);

test.todo('prints output with --packages');
