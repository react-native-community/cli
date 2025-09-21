import info from '../info';
import {logger} from '@react-native-community/cli-tools';
import loadConfig from '@react-native-community/cli-config';

jest.mock('@react-native-community/cli-config', () => ({
  __esModule: true,
  default: () => ({
    project: {},
    root: '.',
  }),
}));

jest.mock('@react-native-community/cli-tools', () => ({
  logger: {
    info: jest.fn(),
    log: jest.fn(),
  },
  version: {
    logIfUpdateAvailable: jest.fn(),
  },
}));

// Mock the envinfo module used by the info command
jest.mock('../../tools/envinfo', () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockResolvedValue('System:\n  OS: macOS\nBinaries:\n  Node: 16.0.0'),
}));

beforeEach(() => {
  jest.resetAllMocks();
});

const config = loadConfig({});

test('prints output without arguments', async () => {
  await info.func([], config);
  expect(logger.info).toHaveBeenCalledWith(
    'Fetching system and libraries information...',
  );
  expect(logger.log).toHaveBeenCalled();
}, 5000); // Reduced timeout since envinfo is now mocked

test.todo('prints output with --packages');
