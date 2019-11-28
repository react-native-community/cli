import {processTemplateName} from '../templateName';
import fs from 'fs';

const RN_NPM_PACKAGE = 'react-native';
const ABS_RN_PATH = '/path/to/react-native';
const ABS_RN_PATH_WINDOWS = 'path/to/react-native';

test('supports file protocol with absolute path', () => {
  jest.spyOn(fs, 'existsSync').mockImplementationOnce(() => true);
  jest
    .spyOn(fs, 'readFileSync')
    .mockImplementationOnce(() => JSON.stringify({name: 'react-native'}));
  expect(processTemplateName(`file://${ABS_RN_PATH}`)).toEqual({
    uri: process.platform === 'win32' ? ABS_RN_PATH_WINDOWS : ABS_RN_PATH,
    name: RN_NPM_PACKAGE,
  });
});

test('supports npm packages as template names', () => {
  expect(processTemplateName(RN_NPM_PACKAGE)).toEqual({
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
  ({templateName, uri, name}) => {
    expect(processTemplateName(templateName)).toEqual({uri, name});
  },
);

test('supports path to tgz archives', () => {
  const ABS_RN_TARBALL_PATH =
    '/path/to/react-native/react-native-1.2.3-rc.0.tgz';
  jest.spyOn(fs, 'existsSync').mockImplementationOnce(() => true);
  expect(processTemplateName(`file://${ABS_RN_TARBALL_PATH}`)).toEqual({
    uri: `file://${ABS_RN_TARBALL_PATH}`,
    name: 'react-native',
  });
});
