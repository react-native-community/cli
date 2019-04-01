// @flow
import {processTemplateName, tryTemplateShorthand} from '../templateName';
import {fetch} from '../../../tools/fetch';

jest.mock('../../../tools/fetch', () => ({fetch: jest.fn()}));

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

test('tryTemplateShorthand should detect a shorthand template', async () => {
  const templateName = 'typescript';
  (fetch: any).mockImplementation(() => {
    return Promise.resolve(`{"name": "react-native-template-${templateName}"}`);
  });
  const name = await tryTemplateShorthand(templateName);
  expect(name).toBe(`react-native-template-${templateName}`);
});

test('tryTemplateShorthand should fallback if no template is found', async () => {
  const templateName = 'typescriptz';
  (fetch: any).mockImplementation(() => {
    return Promise.resolve('Not found');
  });
  const name = await tryTemplateShorthand(templateName);
  expect(name).toBe(templateName);
});
