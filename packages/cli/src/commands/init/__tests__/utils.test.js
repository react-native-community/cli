// @flow
import path from 'path';
import {getReactNativeVersion} from '../utils';

const ABS_RN_PATH = '/path/to/react-native';
const REL_RN_PATH = '../path/to/react-native';
const CWD = '/User/name/projects';

describe('getReactNativeVersion', () => {
  it('should get react-native package version', () => {
    expect(getReactNativeVersion('0.58.0')).toEqual('react-native@0.58.0');
  });

  it('should get react-native from absolute path', () => {
    expect(getReactNativeVersion(`file:${ABS_RN_PATH}`)).toEqual(ABS_RN_PATH);
  });

  it('should get react-native from relative path', () => {
    jest.spyOn(path, 'resolve');
    jest.spyOn(process, 'cwd').mockImplementation(() => CWD);

    getReactNativeVersion(`file:${REL_RN_PATH}`);

    expect(process.cwd).toHaveBeenCalled();
    expect(path.resolve).toHaveBeenCalledWith(CWD, '..', REL_RN_PATH);
  });
});
