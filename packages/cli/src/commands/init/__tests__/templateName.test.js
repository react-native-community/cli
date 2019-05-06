// @flow
import {processTemplateName} from '../templateName';
import {fetch} from '../../../tools/fetch';

jest.mock('../../../tools/fetch', () => ({fetch: jest.fn()}));

const RN_NPM_PACKAGE = 'react-native';
const ABS_RN_PATH = '/path/to/react-native';

test('supports file protocol with absolute path', async () => {
  jest.mock(
    `${ABS_RN_PATH}/package.json`,
    () => ({
      name: 'react-native',
    }),
    {virtual: true},
  );
  expect(await processTemplateName(`file://${ABS_RN_PATH}`)).toEqual({
    uri: ABS_RN_PATH,
    name: RN_NPM_PACKAGE,
  });
});

test('supports shorthand templates', async () => {
  const templateName = 'typescript';
  (fetch: any).mockImplementationOnce(() => {
    return Promise.resolve(`{"name": "react-native-template-${templateName}"}`);
  });
  expect(await processTemplateName(templateName)).toEqual({
    uri: `react-native-template-${templateName}`,
    name: `react-native-template-${templateName}`,
  });
});

test('supports not-found shorthand templates', async () => {
  const templateName = 'typescriptz';
  (fetch: any).mockImplementationOnce(() => {
    return Promise.resolve('Not found');
  });
  expect(await processTemplateName(templateName)).toEqual({
    uri: templateName,
    name: templateName,
  });
});

test('supports npm packages as template names', async () => {
  expect(await processTemplateName(RN_NPM_PACKAGE)).toEqual({
    uri: RN_NPM_PACKAGE,
    name: RN_NPM_PACKAGE,
  });
});

test('supports versioned npm packages as template names', async () => {
  const RN_WITH_VERSION = 'react-native@0.58.0';
  expect(await processTemplateName(RN_WITH_VERSION)).toEqual({
    uri: RN_WITH_VERSION,
    name: RN_NPM_PACKAGE,
  });
});

test('supports path to tgz archives', async () => {
  const ABS_RN_TARBALL_PATH =
    '/path/to/react-native/react-native-1.2.3-rc.0.tgz';
  expect(await processTemplateName(`file://${ABS_RN_TARBALL_PATH}`)).toEqual({
    uri: `file://${ABS_RN_TARBALL_PATH}`,
    name: 'react-native',
  });
});
