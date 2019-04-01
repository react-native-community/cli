// @flow
import {processTemplateName} from '../protocols';

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
  expect(processTemplateName(`file://${ABS_RN_PATH}`)).toEqual({
    uri: ABS_RN_PATH,
    name: PACKAGE_NAME,
  });
});

test('should get default package if none protocols were handled', () => {
  expect(processTemplateName(VERSION)).toEqual({
    uri: VERSION,
    name: VERSION,
  });
});

test('should get package if none protocols were handled', () => {
  expect(processTemplateName(RN_WITH_VERSION)).toEqual({
    uri: RN_WITH_VERSION,
    name: RN_WITH_VERSION,
  });
});
