// @flow
import {processTemplateName} from '../templateName';
import {fetch} from '../../../tools/fetch';

jest.mock('../../../tools/fetch', () => ({fetch: jest.fn()}));

const VERSION = '0.58.0';
const RN_WITH_VERSION = 'react-native@0.58.0';
const ABS_RN_PATH = '/path/to/react-native';
const PACKAGE_NAME = 'react-native';

test('should support file protocol with absolute path', async () => {
  jest.mock(
    `${ABS_RN_PATH}/package.json`,
    () => ({
      name: 'react-native',
    }),
    {virtual: true},
  );
  expect(await processTemplateName(`file://${ABS_RN_PATH}`)).toEqual({
    uri: ABS_RN_PATH,
    name: PACKAGE_NAME,
  });
});

test('should get default package if none protocols were handled', async () => {
  expect(await processTemplateName(VERSION)).toEqual({
    uri: VERSION,
    name: VERSION,
  });
});

test('should support shorthand templates', async () => {
  const templateName = 'typescript';
  (fetch: any).mockImplementationOnce(() => {
    return Promise.resolve(`{"name": "react-native-template-${templateName}"}`);
  });
  expect(await processTemplateName(templateName)).toEqual({
    uri: `react-native-template-${templateName}`,
    name: `react-native-template-${templateName}`,
  });
});

test('should support not-found shorthand templates', async () => {
  const templateName = 'typescriptz';
  (fetch: any).mockImplementationOnce(() => {
    return Promise.resolve('Not found');
  });
  expect(await processTemplateName(templateName)).toEqual({
    uri: templateName,
    name: templateName,
  });
});

test('should get package if none protocols were handled', async () => {
  expect(await processTemplateName(RN_WITH_VERSION)).toEqual({
    uri: RN_WITH_VERSION,
    name: RN_WITH_VERSION,
  });
});
