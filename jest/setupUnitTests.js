/**
 * @flow
 */

jest.mock('@react-native-community/cli-tools', () => ({
  ...jest.requireActual('@react-native-community/cli-tools'),
  logger: {
    success: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    setVerbose: jest.fn(),
    isVerbose: jest.fn(),
  },
}));

jest.setTimeout(20000);
