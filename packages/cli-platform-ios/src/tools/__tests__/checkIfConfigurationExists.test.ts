import {checkIfConfigurationExists} from '../checkIfConfigurationExists';

const PROJECT_INFO = {
  configurations: ['Debug', 'Release'],
  name: 'MyApp',
  schemes: ['MyApp', 'Scheme'],
  targets: ['MyApp', 'MyAppTests'],
};

describe('checkIfConfigurationExists', () => {
  test('should throw an error if project info does not contain selected configuration', () => {
    const checkConfig = () => checkIfConfigurationExists(PROJECT_INFO, 'Test');

    expect(checkConfig).toThrow();
  });

  test('should not throw an error if project info contains selected configuration', () => {
    const checkConfig = () => checkIfConfigurationExists(PROJECT_INFO, 'Debug');

    expect(checkConfig).not.toThrow();
  });
});
