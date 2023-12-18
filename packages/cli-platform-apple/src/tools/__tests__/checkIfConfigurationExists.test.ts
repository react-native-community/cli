import {checkIfConfigurationExists} from '../checkIfConfigurationExists';

const CONFIGURATIONS = ['Debug', 'Release'];
const NON_EXISTING_CONFIG = 'Test';

describe('checkIfConfigurationExists', () => {
  test('should throw an error if project info does not contain selected configuration', () => {
    const checkConfig = () =>
      checkIfConfigurationExists(CONFIGURATIONS, NON_EXISTING_CONFIG);

    expect(checkConfig).toThrowError(
      `Configuration "${NON_EXISTING_CONFIG}" does not exist in your project. Please use one of the existing configurations: ${CONFIGURATIONS.join(
        ', ',
      )}`,
    );
  });

  test('should not throw an error if project info contains selected configuration', () => {
    const checkConfig = () =>
      checkIfConfigurationExists(CONFIGURATIONS, 'Debug');

    expect(checkConfig).not.toThrow();
  });

  test('should not throw an error if project could not be found', () => {
    const checkConfig = () => checkIfConfigurationExists([], 'Debug');

    expect(checkConfig).not.toThrow();
  });
});
