// @flow
import fs from 'fs-extra';
import path from 'path';
import ChildProcess from 'child_process';
import * as PackageManger from '../../../tools/PackageManager';
import {
  installTemplatePackage,
  getTemplateConfig,
  copyTemplate,
  executePostInitScript,
} from '../template';

const TEMPLATE_NAME = 'templateName';

afterEach(() => {
  jest.restoreAllMocks();
});

test('installTemplatePackage', () => {
  jest.spyOn(PackageManger, 'install').mockImplementationOnce(() => {});

  installTemplatePackage(TEMPLATE_NAME, true);

  expect(PackageManger.install).toHaveBeenCalledWith([TEMPLATE_NAME], {
    preferYarn: false,
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
  jest.spyOn(fs, 'copySync').mockImplementationOnce(() => {});
  jest.spyOn(process, 'cwd').mockImplementationOnce(() => CWD);

  copyTemplate(TEMPLATE_NAME, TEMPLATE_DIR);

  expect(path.resolve).toHaveBeenCalledWith(
    'node_modules',
    TEMPLATE_NAME,
    TEMPLATE_DIR,
  );
  expect(fs.copySync).toHaveBeenCalledWith(expect.any(String), CWD);
});

test('executePostInitScript', () => {
  const RESOLVED_PATH = '/some/path/script.js';
  const SCRIPT_PATH = './script.js';

  jest.spyOn(path, 'resolve').mockImplementationOnce(() => RESOLVED_PATH);
  jest.spyOn(ChildProcess, 'execFileSync').mockImplementationOnce(() => {});

  executePostInitScript(TEMPLATE_NAME, SCRIPT_PATH);

  expect(path.resolve).toHaveBeenCalledWith(
    'node_modules',
    TEMPLATE_NAME,
    SCRIPT_PATH,
  );
  expect(ChildProcess.execFileSync).toHaveBeenCalledWith(RESOLVED_PATH);
});
