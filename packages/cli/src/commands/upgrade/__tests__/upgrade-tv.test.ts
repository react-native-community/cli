import UpgradeTestingMethods from './upgrade-testing-methods';

jest.mock(
  '/project/root/node_modules/react-native/package.json',
  () => ({name: 'react-native-tvos', version: '0.62.2-1'}),
  {virtual: true},
);
jest.mock(
  '/project/root/package.json',
  () => ({
    name: 'TestApp',
    dependencies: {'react-native': 'npm:react-native-tvos@^0.62.2-1'},
  }),
  {virtual: true},
);
jest.mock(
  '/project/root/NestedApp/node_modules/react-native/package.json',
  () => ({name: 'react-native-tvos', version: '0.62.2-1'}),
  {virtual: true},
);
jest.mock(
  '/project/root/NestedApp/package.json',
  () => ({
    name: 'TestAppNested',
    dependencies: {'react-native': 'npm:react-native-tvos@^0.62.2-1'},
  }),
  {virtual: true},
);

const repoName = 'react-native-tvos';
const currentVersion = '0.62.2-1';
const newVersion = '0.64.2-4';
const olderVersion = '0.60.2-1';
const lessOlderVersion = '0.63.3-0';

describe('Upgrade tests for react-native-tvos repo', () => {
  beforeEach(() => {
    UpgradeTestingMethods.setup();
  });

  afterEach(() => {
    UpgradeTestingMethods.teardown();
  });

  test('uses latest version of react-native when none passed', async () => {
    await UpgradeTestingMethods.usesLatestVersionWhenNonePassed(repoName);
  }, 60000);

  test('applies patch in current working directory when nested', async () => {
    await UpgradeTestingMethods.appliesPatchInCwdWhenNested(newVersion);
  });

  test('errors when invalid version passed', async () => {
    await UpgradeTestingMethods.errorsWhenInvalidVersionPassed();
  }, 60000);

  test('errors when older version passed', async () => {
    await UpgradeTestingMethods.errorsWhenOlderVersionPassed(
      olderVersion,
      lessOlderVersion,
      currentVersion,
    );
  }, 60000);

  test('warns when dependency upgrade version is in semver range', async () => {
    await UpgradeTestingMethods.warnsWhenDependencyInSemverRange(
      currentVersion,
    );
  }, 60000);

  test('fetches empty patch and installs deps', async () => {
    await UpgradeTestingMethods.fetchesEmptyPatchAndInstallsDeps(newVersion);
  }, 60000);

  test('fetches regular patch, adds remote, applies patch, installs deps, removes remote,', async () => {
    await UpgradeTestingMethods.fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemote(
      newVersion,
    );
  }, 60000);

  test('fetches regular patch, adds remote, applies patch, installs deps, removes remote when updated from nested directory', async () => {
    await UpgradeTestingMethods.fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemoteNested(
      newVersion,
    );
  }, 60000);

  test('cleans up if patching fails,', async () => {
    await UpgradeTestingMethods.cleansUpIfPatchingFails(newVersion);
  }, 60000);

  test('works with --name-ios and --name-android', async () => {
    await UpgradeTestingMethods.worksWithNameIosAndNameAndroid(newVersion);
  }, 60000);
});
