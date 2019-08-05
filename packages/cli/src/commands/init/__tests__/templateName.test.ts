import {processTemplateName} from '../templateName';
import fs from 'fs';

const RN_NPM_PACKAGE = 'react-native';
const ABS_RN_PATH = '/path/to/react-native';
const ABS_RN_PATH_WINDOWS = 'path/to/react-native';

test('supports file protocol with absolute path', async () => {
  jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
  jest
    .spyOn(fs, 'readFileSync')
    .mockImplementation(() => JSON.stringify({name: 'react-native'}));
  expect(await processTemplateName(`file://${ABS_RN_PATH}`)).toEqual({
    uri: process.platform === 'win32' ? ABS_RN_PATH_WINDOWS : ABS_RN_PATH,
    name: RN_NPM_PACKAGE,
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
  ${'@scoped/name'}        | ${'@scoped/name'}        | ${'@scoped/name'}
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
  jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
  expect(await processTemplateName(`file://${ABS_RN_TARBALL_PATH}`)).toEqual({
    uri: `file://${ABS_RN_TARBALL_PATH}`,
    name: 'react-native',
  });
});
