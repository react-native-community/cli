// @flow
import {processTemplateName} from '../templateName';
import {fetch} from '@react-native-community/cli-tools';

jest.mock('@react-native-community/cli-tools', () => ({fetch: jest.fn()}));

const RN_NPM_PACKAGE = 'react-native';
const ABS_RN_PATH = '/path/to/react-native';

const mockFetch = (value: any, status: number) => {
  (fetch: any).mockImplementation(() =>
    Promise.resolve({json: () => Promise.resolve(value), status}),
  );
};

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
  mockFetch({name: 'react-native-template-${templateName}'}, 200);
  expect(await processTemplateName(templateName)).toEqual({
    uri: `react-native-template-${templateName}`,
    name: `react-native-template-${templateName}`,
  });
});

test('supports not-found shorthand templates', async () => {
  const templateName = 'typescriptz';
  mockFetch('Not found', 200);
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

test.each`
  templateName             | uri                      | name
  ${'react-native@0.58.0'} | ${'react-native@0.58.0'} | ${'react-native'}
  ${'some-name@latest'}    | ${'some-name@latest'}    | ${'some-name'}
  ${'@scoped/name@0.58.0'} | ${'@scoped/name@0.58.0'} | ${'@scoped/name'}
  ${'@scoped/name@tag'}    | ${'@scoped/name@tag'}    | ${'@scoped/name'}
`(
  'supports versioned npm package "$templateName" as template name',
  async ({templateName, uri, name}) => {
    expect(await processTemplateName(templateName)).toEqual({uri, name});
  },
);

test('supports path to tgz archives', async () => {
  const ABS_RN_TARBALL_PATH =
    '/path/to/react-native/react-native-1.2.3-rc.0.tgz';
  expect(await processTemplateName(`file://${ABS_RN_TARBALL_PATH}`)).toEqual({
    uri: `file://${ABS_RN_TARBALL_PATH}`,
    name: 'react-native',
  });
});
