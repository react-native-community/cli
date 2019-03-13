// @flow
import fs from 'fs-extra';
import path from 'path';
import {getReactNativeVersion, getTemplateName} from '../utils';

const ABS_RN_PATH = '/path/to/react-native';
const REL_RN_PATH = '../path/to/react-native';
const CWD = '/User/name/projects';
const TEMPLATE_NAME = 'ProjectName';
const APP_JSON_CONTENT = `{ "templateName": "${TEMPLATE_NAME}" }`;

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

describe('getTemplateName', () => {
  it('should get template name', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => APP_JSON_CONTENT);
    jest.spyOn(process, 'cwd').mockImplementation(() => CWD);
    jest.spyOn(path, 'join');

    const templateName = getTemplateName();

    expect(templateName).toEqual(TEMPLATE_NAME);
    expect(process.cwd).toHaveBeenCalled();
    expect(path.join).toHaveBeenCalledWith(CWD, 'app.json');
  });

  it('should throw error if app.json is not present', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => new Error());

    expect(getTemplateName).toThrowError();
  });
});
