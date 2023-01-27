import {checkIfConfigurationExists} from '../checkIfConfigurationExists';

const CONFIGURATIONS = ['Debug', 'Release'];
const NON_EXISTING_CONFIG = 'Test';
const PROJECT_INFO = {
  configurations: CONFIGURATIONS,
  name: 'MyApp',
  schemes: ['MyApp', 'Scheme'],
  targets: ['MyApp', 'MyAppTests'],
};

describe('checkIfConfigurationExists', () => {
  test('should throw an error if project info does not contain selected configuration', () => {
    const checkConfig = () =>
      checkIfConfigurationExists(PROJECT_INFO, NON_EXISTING_CONFIG);

    expect(checkConfig).toThrowError(
      `Configuration "${NON_EXISTING_CONFIG}" does not exist in your project. Please use one of the existing configurations: ${CONFIGURATIONS.join(
        ', ',
      )}`,
    );
  });

  test('should not throw an error if project info contains selected configuration', () => {
    const checkConfig = () => checkIfConfigurationExists(PROJECT_INFO, 'Debug');

    expect(checkConfig).not.toThrow();
  });
});
