// @flow
import path from 'path';
import {supportProtocols} from '../protocols';

const VERSION = '0.58.0';
const RN_WITH_VERSION = 'react-native@0.58.0';
const ABS_RN_PATH = '/path/to/react-native';
const REL_RN_PATH = '../path/to/react-native';
const CWD = '/User/name/projects';

test('should support file protocol with absolute path', () => {
  expect(supportProtocols(`file:${ABS_RN_PATH}`)).toEqual(ABS_RN_PATH);
});

test('should support file protocol with relative path', () => {
  jest.spyOn(path, 'resolve');
  jest.spyOn(process, 'cwd').mockImplementation(() => CWD);

  supportProtocols(`file:${REL_RN_PATH}`);

  expect(process.cwd).toHaveBeenCalled();
  expect(path.resolve).toHaveBeenCalledWith(CWD, '..', REL_RN_PATH);
});

test('should get default package if none protocols were handled', () => {
  expect(supportProtocols(VERSION)).toEqual(VERSION);
});

test('should get package if none protocols were handled', () => {
  expect(supportProtocols(VERSION, RN_WITH_VERSION)).toEqual(RN_WITH_VERSION);
});
