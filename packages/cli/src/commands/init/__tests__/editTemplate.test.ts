import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import snapshotDiff from 'snapshot-diff';
import slash from 'slash';
import walk from '../../../tools/walk';
import copyFiles from '../../../tools/copyFiles';
import {
  changePlaceholderInTemplate,
  replacePlaceholderWithPackageName,
  validatePackageName,
  replaceNameInUTF8File,
} from '../editTemplate';
import semver from 'semver';

const skipIfNode20 = semver.major(process.version) === 20 ? test.skip : test;

const FIXTURE_DIR = path.resolve(
  __dirname,
  '..',
  '__fixtures__',
  'editTemplate',
);
const PLACEHOLDER_NAME = 'PlaceholderName';
const PROJECT_NAME = 'ProjectName';
const PROJECT_TITLE = 'ProjectTitle';
const PACKAGE_NAME = 'com.example.app';

async function createTestEnv() {
  const TEST_DIR = `rncli-should-edit-template-${Date.now()}`;
  const tmpDir = os.tmpdir();
  const testPath = path.resolve(tmpDir, TEST_DIR);

  fs.mkdirSync(testPath);
  await copyFiles(FIXTURE_DIR, testPath);

  return testPath;
}

let testPath;

beforeEach(async () => {
  testPath = await createTestEnv();
});

afterEach(() => {
  fs.removeSync(testPath);
});

skipIfNode20('should edit template', async () => {
  jest.spyOn(process, 'cwd').mockImplementation(() => testPath);

  await changePlaceholderInTemplate({
    projectName: PROJECT_NAME,
    placeholderName: PLACEHOLDER_NAME,
  });

  const transformedTree = walk(testPath).map((e) => e.replace(testPath, ''));
  const fixtureTree = walk(FIXTURE_DIR).map((e) => e.replace(FIXTURE_DIR, ''));

  const oldXmlFile = fs.readFileSync(
    path.resolve(FIXTURE_DIR, 'android', 'strings.xml'),
    'utf8',
  );
  const newXmlFile = fs.readFileSync(
    path.resolve(testPath, 'android', 'strings.xml'),
    'utf8',
  );

  const oldCFile = fs.readFileSync(
    path.resolve(FIXTURE_DIR, 'ios', PLACEHOLDER_NAME, 'AppDelegate.m'),
    'utf8',
  );
  const newCFile = fs.readFileSync(
    path.resolve(testPath, 'ios', PROJECT_NAME, 'AppDelegate.m'),
    'utf8',
  );

  expect(snapshotDiff(oldCFile, newCFile, {contextLines: 1})).toMatchSnapshot();
  expect(
    snapshotDiff(oldXmlFile, newXmlFile, {contextLines: 1}),
  ).toMatchSnapshot();
  expect(
    snapshotDiff(fixtureTree.map(slash), transformedTree.map(slash), {
      contextLines: 1,
    }),
  ).toMatchSnapshot();
});

skipIfNode20('should edit template with custom title', async () => {
  jest.spyOn(process, 'cwd').mockImplementation(() => testPath);

  await changePlaceholderInTemplate({
    projectName: PROJECT_NAME,
    placeholderName: PLACEHOLDER_NAME,
    projectTitle: PROJECT_TITLE,
  });

  const replacedFile = fs.readFileSync(
    path.resolve(testPath, 'android', 'strings.xml'),
    'utf8',
  );

  expect(replacedFile).toContain(
    `<string name="app_name">${PROJECT_TITLE}</string>`,
  );
});

describe('changePlaceholderInTemplate', () => {
  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockImplementation(() => testPath);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  skipIfNode20(
    `should produce a lowercased version of "${PROJECT_NAME}" in package.json "name" field`,
    async () => {
      await changePlaceholderInTemplate({
        projectName: PROJECT_NAME,
        placeholderName: PLACEHOLDER_NAME,
      });

      const oldPackageJsonFile = fs.readFileSync(
        path.resolve(FIXTURE_DIR, 'package.json'),
        'utf8',
      );
      const newPackageJsonFile = fs.readFileSync(
        path.resolve(testPath, 'package.json'),
        'utf8',
      );

      expect(
        snapshotDiff(oldPackageJsonFile, newPackageJsonFile, {contextLines: 1}),
      ).toMatchSnapshot();
    },
  );
});

describe('replacePlaceholderWithPackageName', () => {
  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockImplementation(() => testPath);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  skipIfNode20(
    `should replace name in package.json with ${PACKAGE_NAME} value`,
    async () => {
      await replacePlaceholderWithPackageName({
        projectName: PROJECT_NAME,
        placeholderName: PLACEHOLDER_NAME,
        placeholderTitle: 'Test',
        packageName: PACKAGE_NAME,
      });
      const packageJsonFile = fs.readFileSync(
        path.resolve(testPath, 'package.json'),
        'utf8',
      );

      expect(JSON.parse(packageJsonFile).name).toBe(PACKAGE_NAME);
    },
  );

  skipIfNode20('should update the bundle ID for iOS', async () => {
    await replacePlaceholderWithPackageName({
      projectName: PROJECT_NAME,
      placeholderName: PLACEHOLDER_NAME,
      placeholderTitle: 'Test',
      packageName: PACKAGE_NAME,
    });

    const xcodeProjectFile = fs.readFileSync(
      path.resolve(testPath, 'ios', PROJECT_NAME, 'project.pbxproj'),
      'utf8',
    );
    expect(
      xcodeProjectFile.includes(
        `PRODUCT_BUNDLE_IDENTIFIER = "${PACKAGE_NAME}"`,
      ),
    ).toBeTruthy();
  });

  skipIfNode20(
    `should rename Main component name for Android with ${PROJECT_NAME} in Java template`,
    async () => {
      await replacePlaceholderWithPackageName({
        projectName: PROJECT_NAME,
        placeholderName: PLACEHOLDER_NAME,
        placeholderTitle: 'Test',
        packageName: PACKAGE_NAME,
      });

      const mainActivityFile = fs.readFileSync(
        path.resolve(
          testPath,
          'android',
          'android-java',
          'com',
          PACKAGE_NAME,
          'MainActivity.java',
        ),
        'utf8',
      );

      expect(
        mainActivityFile.includes(`return "${PROJECT_NAME}"`),
      ).toBeTruthy();
    },
  );

  skipIfNode20(
    `should rename Main component name for Android with ${PROJECT_NAME} in Kotlin template`,
    async () => {
      await replacePlaceholderWithPackageName({
        projectName: PROJECT_NAME,
        placeholderName: PLACEHOLDER_NAME,
        placeholderTitle: 'Test',
        packageName: PACKAGE_NAME,
      });

      const mainActivityFile = fs.readFileSync(
        path.resolve(
          testPath,
          'android',
          'android-kotlin',
          'com',
          PACKAGE_NAME,
          'MainActivity.kt',
        ),
        'utf8',
      );

      expect(mainActivityFile.includes(`= "${PROJECT_NAME}"`)).toBeTruthy();
    },
  );
});

describe('validatePackageName', () => {
  skipIfNode20(
    'should throw an error when package name contains only one segment',
    () => {
      expect(() => validatePackageName('example')).toThrowError(
        'The package name example is invalid. It should contain at least two segments, e.g. com.app',
      );
    },
  );

  skipIfNode20(
    'should throw an error when package name contains special characters other than dots',
    () => {
      expect(() => validatePackageName('com.organization.a@pp')).toThrowError(
        'The com.organization.a@pp package name is not valid. It can contain only alphanumeric characters and dots.',
      );
    },
  );
});

describe('replaceNameInUTF8File', () => {
  skipIfNode20('should replace string in utf8 file', async () => {
    const pathToUtf8File = path.join(
      testPath,
      'ios',
      PLACEHOLDER_NAME,
      'project.pbxproj',
    );

    const textToReplace = `PRODUCT_BUNDLE_IDENTIFIER = "${PACKAGE_NAME}"`;

    const beforeReplacement = await fs.readFile(pathToUtf8File, 'utf8');

    await replaceNameInUTF8File(
      pathToUtf8File,
      textToReplace,
      'PRODUCT_BUNDLE_IDENTIFIER = "(.*)"',
    );

    const afterReplacement = await fs.readFile(pathToUtf8File, 'utf8');

    expect(beforeReplacement).not.toBe(afterReplacement);
    expect(afterReplacement).toContain(textToReplace);
  });

  skipIfNode20('should not replace string in utf8 file', async () => {
    const fsWriteFileSpy = jest.spyOn(fs, 'writeFile');
    const pathToUtf8File = path.join(
      testPath,
      'ios',
      PLACEHOLDER_NAME,
      'project.pbxproj',
    );

    const beforeReplacement = await fs.readFile(pathToUtf8File, 'utf8');

    await replaceNameInUTF8File(
      pathToUtf8File,
      'random-string',
      'random-string',
    );

    const afterReplacement = await fs.readFile(pathToUtf8File, 'utf8');

    expect(beforeReplacement).toEqual(afterReplacement);
    expect(fsWriteFileSpy).toHaveBeenCalledTimes(0);
  });
});
