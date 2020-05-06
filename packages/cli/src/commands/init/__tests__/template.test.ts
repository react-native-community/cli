jest.mock('execa', () => jest.fn());
import execa from 'execa';
import path from 'path';
import fs from 'fs';
import * as PackageManger from '../../../tools/packageManager';
import {
  installTemplatePackage,
  getTemplateConfig,
  copyTemplate,
  executePostInitScript,
} from '../template';
import * as copyFiles from '../../../tools/copyFiles';

const TEMPLATE_NAME = 'templateName';
const TEMPLATE_SOURCE_DIR = '/tmp/rncli-init-template-123456';

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test('installTemplatePackage', async () => {
  jest.spyOn(PackageManger, 'install').mockImplementationOnce(() => null);

  await installTemplatePackage(TEMPLATE_NAME, TEMPLATE_SOURCE_DIR, true);

  expect(PackageManger.install).toHaveBeenCalledWith([TEMPLATE_NAME], {
    preferYarn: false,
    silent: true,
    root: TEMPLATE_SOURCE_DIR,
  });
});

test('getTemplateConfig', () => {
  jest.mock(
    `${TEMPLATE_SOURCE_DIR}/node_modules/${TEMPLATE_NAME}/template.config.js`,
    () => ({
      placeholderName: 'someName',
      templateDir: 'someDir',
    }),
    {
      virtual: true,
    },
  );
  jest.spyOn(path, 'resolve').mockImplementationOnce((...e) => e.join('/'));
  jest.spyOn(fs, 'existsSync').mockImplementationOnce(() => true);
  expect(getTemplateConfig(TEMPLATE_NAME, TEMPLATE_SOURCE_DIR)).toEqual({
    placeholderName: 'someName',
    templateDir: 'someDir',
  });
  expect(path.resolve).toHaveBeenCalledWith(
    TEMPLATE_SOURCE_DIR,
    'node_modules',
    TEMPLATE_NAME,
    'template.config.js',
  );
});

test('copyTemplate', async () => {
  const TEMPLATE_DIR = 'some/dir';
  const CWD = '.';

  jest.spyOn(path, 'resolve').mockImplementationOnce((...e) => e.join('/'));
  jest.spyOn(copyFiles, 'default').mockImplementationOnce(() => null);
  jest.spyOn(process, 'cwd').mockImplementationOnce(() => CWD);

  await copyTemplate(TEMPLATE_NAME, TEMPLATE_DIR, TEMPLATE_SOURCE_DIR);

  expect(path.resolve).toHaveBeenCalledWith(
    TEMPLATE_SOURCE_DIR,
    'node_modules',
    TEMPLATE_NAME,
    TEMPLATE_DIR,
  );
  expect(copyFiles.default).toHaveBeenCalledWith(expect.any(String), CWD, {
    exclude: [expect.any(RegExp)],
  });
});

test('executePostInitScript', async () => {
  const RESOLVED_PATH = '/some/path/script.js';
  const SCRIPT_PATH = './script.js';

  jest.spyOn(path, 'resolve').mockImplementationOnce(() => RESOLVED_PATH);

  await executePostInitScript(TEMPLATE_NAME, SCRIPT_PATH, TEMPLATE_SOURCE_DIR);

  expect(path.resolve).toHaveBeenCalledWith(
    TEMPLATE_SOURCE_DIR,
    'node_modules',
    TEMPLATE_NAME,
    SCRIPT_PATH,
  );
  expect(execa).toHaveBeenCalledWith(RESOLVED_PATH, {
    stdio: 'inherit',
  });
});
