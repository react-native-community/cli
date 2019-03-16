// @flow
import {supportProtocols} from '../protocols';

const VERSION = '0.58.0';
const RN_WITH_VERSION = 'react-native@0.58.0';
const ABS_RN_PATH = '/path/to/react-native';
const PACKAGE_NAME = 'react-native';

test('should support file protocol with absolute path', () => {
  jest.mock(
    `${ABS_RN_PATH}/package.json`,
    () => ({
      name: 'react-native',
    }),
    {virtual: true},
  );
  expect(supportProtocols(`file://${ABS_RN_PATH}`)).toEqual({
    packageDir: ABS_RN_PATH,
    packageName: PACKAGE_NAME,
  });
});

test('should get default package if none protocols were handled', () => {
  expect(supportProtocols(VERSION)).toEqual({
    packageDir: VERSION,
    packageName: VERSION,
  });
});

test('should get package if none protocols were handled', () => {
  expect(supportProtocols(VERSION, RN_WITH_VERSION)).toEqual({
    packageDir: RN_WITH_VERSION,
    packageName: RN_WITH_VERSION,
  });
});
