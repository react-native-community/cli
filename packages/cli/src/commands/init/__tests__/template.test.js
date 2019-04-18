// @flow
jest.mock('execa', () => jest.fn());
import execa from 'execa';
import path from 'path';
import * as PackageManger from '../../../tools/packageManager';
import {
  installTemplatePackage,
  getTemplateConfig,
  copyTemplate,
  executePostInitScript,
} from '../template';
import * as copyFiles from '../../../tools/copyFiles';

const TEMPLATE_NAME = 'templateName';

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test('installTemplatePackage', async () => {
  jest.spyOn(PackageManger, 'install').mockImplementationOnce(() => {});

  await installTemplatePackage(TEMPLATE_NAME, true);

  expect(PackageManger.install).toHaveBeenCalledWith([TEMPLATE_NAME], {
    preferYarn: false,
    silent: true,
  });
});

test('getTemplateConfig', () => {
  jest.mock(
    `node_modules/${TEMPLATE_NAME}/template.config`,
    () => ({
      placeholderName: 'someName',
      templateDir: 'someDir',
    }),
    {
      virtual: true,
    },
  );
  jest.spyOn(path, 'resolve').mockImplementationOnce((...e) => e.join('/'));

  expect(getTemplateConfig(TEMPLATE_NAME)).toEqual({
    placeholderName: 'someName',
    templateDir: 'someDir',
  });
  expect(path.resolve).toHaveBeenCalledWith(
    'node_modules',
    TEMPLATE_NAME,
    'template.config',
  );
});

test('copyTemplate', () => {
  const TEMPLATE_DIR = 'some/dir';
  const CWD = '.';

  jest.spyOn(path, 'resolve').mockImplementationOnce((...e) => e.join('/'));
  jest.spyOn(copyFiles, 'default').mockImplementationOnce(() => {});
  jest.spyOn(process, 'cwd').mockImplementationOnce(() => CWD);

  copyTemplate(TEMPLATE_NAME, TEMPLATE_DIR);

  expect(path.resolve).toHaveBeenCalledWith(
    'node_modules',
    TEMPLATE_NAME,
    TEMPLATE_DIR,
  );
  expect(copyFiles.default).toHaveBeenCalledWith(expect.any(String), CWD);
});

test('executePostInitScript', async () => {
  const RESOLVED_PATH = '/some/path/script.js';
  const SCRIPT_PATH = './script.js';

  jest.spyOn(path, 'resolve').mockImplementationOnce(() => RESOLVED_PATH);

  await executePostInitScript(TEMPLATE_NAME, SCRIPT_PATH);

  expect(path.resolve).toHaveBeenCalledWith(
    'node_modules',
    TEMPLATE_NAME,
    SCRIPT_PATH,
  );
  expect(execa).toHaveBeenCalledWith(RESOLVED_PATH, {
    stdio: 'inherit',
  });
});
