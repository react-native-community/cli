const usesLatestVersionWhenNonePassed = async (
  upgrade,
  ctx,
  execa,
  repoName,
) => {
  await upgrade.func([], ctx);
  expect(execa).toBeCalledWith('npm', ['info', repoName, 'version']);
};

const appliesPatchInCwdWhenNested = async (
  mockFetch,
  samplePatch,
  execa,
  mockExecaNested,
  ctx,
  upgrade,
  newVersion,
) => {
  mockFetch(samplePatch, 200);
  ((execa as unknown) as jest.Mock).mockImplementation(mockExecaNested);
  const config = {...ctx, root: '/project/root/NestedApp'};
  await upgrade.func([newVersion], config);

  expect(execa).toBeCalledWith('git', [
    'apply',
    'tmp-upgrade-rn.patch',
    '--exclude=NestedApp/package.json',
    '-p2',
    '--3way',
    '--directory=NestedApp/',
  ]);
};

const errorsWhenInvalidVersionPassed = async (upgrade, ctx, logger) => {
  await upgrade.func(['next'], ctx);
  expect(logger.error).toBeCalledWith(
    'Provided version "next" is not allowed. Please pass a valid semver version',
  );
};

const errorsWhenOlderVersionPassed = async (
  upgrade,
  olderVersion,
  lessOlderVersion,
  ctx,
  currentVersion,
  logger,
) => {
  await upgrade.func([olderVersion], ctx);
  expect(logger.error).toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "${olderVersion}"`,
  );
  await upgrade.func([lessOlderVersion], ctx);
  expect(logger.error).not.toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "${lessOlderVersion}"`,
  );
};

const warnsWhenDependencyInSemverRange = async (
  upgrade,
  currentVersion,
  ctx,
  logger,
) => {
  await upgrade.func([currentVersion], ctx);
  expect(logger.warn).toBeCalledWith(
    `Specified version "${currentVersion}" is already installed in node_modules and it satisfies "^${currentVersion}" semver range. No need to upgrade`,
  );
};

const fetchesEmptyPatchAndInstallsDeps = async (
  mockFetch,
  upgrade,
  newVersion,
  ctx,
  flushOutput,
) => {
  mockFetch();
  await upgrade.func([newVersion], ctx);
  expect(flushOutput()).toMatchSnapshot();
};

const fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemote = async (
  mockFetch,
  samplePatch,
  upgrade,
  newVersion,
  merge,
  ctx,
  flushOutput,
  snapshotDiff,
  fs,
) => {
  mockFetch(samplePatch, 200);
  await upgrade.func(
    [newVersion],
    merge(ctx, {
      project: {
        ios: {projectName: 'TestApp.xcodeproj'},
        android: {packageName: 'com.testapp'},
      },
    }),
  );
  expect(flushOutput()).toMatchSnapshot();
  expect(
    snapshotDiff(
      samplePatch,
      (fs.writeFileSync as jest.Mock).mock.calls[0][1],
      {
        contextLines: 1,
      },
    ),
  ).toMatchSnapshot(
    'RnDiffApp is replaced with app name (TestApp and com.testapp)',
  );
};

const fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemoteNested = async (
  samplePatch,
  mockFetch,
  execa,
  mockExecaNested,
  ctx,
  upgrade,
  newVersion,
  flushOutput,
) => {
  mockFetch(samplePatch, 200);
  ((execa as unknown) as jest.Mock).mockImplementation(mockExecaNested);
  const config = {...ctx, root: '/project/root/NestedApp'};
  await upgrade.func([newVersion], config);
  expect(flushOutput()).toMatchSnapshot();
};

const cleansUpIfPatchingFails = async (
  mockFetch,
  samplePatch,
  execa,
  mockPushLog,
  upgrade,
  newVersion,
  ctx,
  flushOutput,
) => {
  mockFetch(samplePatch, 200);
  ((execa as unknown) as jest.Mock).mockImplementation((command, args) => {
    mockPushLog('$', 'execa', command, args);
    if (command === 'npm' && args[3] === '--json') {
      return Promise.resolve({
        stdout: '{"react": "16.6.3"}',
      });
    }
    if (command === 'git' && args[0] === 'apply') {
      return Promise.reject({
        code: 1,
        stderr:
          'error: .flowconfig: does not exist in index\nerror: ios/MyApp.xcodeproj/project.pbxproj: patch does not apply',
      });
    }
    if (command === 'git' && args[0] === 'rev-parse') {
      return Promise.resolve({stdout: ''});
    }
    return Promise.resolve({stdout: ''});
  });
  try {
    await upgrade.func([newVersion], ctx);
  } catch (error) {
    expect(error.message).toBe(
      'Upgrade failed. Please see the messages above for details',
    );
  }
  expect(flushOutput()).toMatchSnapshot();
};

const worksWithNameIosAndNameAndroid = async (
  mockFetch,
  samplePatch,
  upgrade,
  newVersion,
  merge,
  ctx,
  snapshotDiff,
  fs,
) => {
  mockFetch(samplePatch, 200);
  await upgrade.func(
    [newVersion],
    merge(ctx, {
      project: {
        ios: {projectName: 'CustomIos.xcodeproj'},
        android: {packageName: 'co.uk.customandroid.app'},
      },
    }),
  );
  expect(
    snapshotDiff(
      samplePatch,
      (fs.writeFileSync as jest.Mock).mock.calls[0][1],
      {
        contextLines: 1,
      },
    ),
  ).toMatchSnapshot(
    'RnDiffApp is replaced with app name (CustomIos and co.uk.customandroid.app)',
  );
};

export default {
  usesLatestVersionWhenNonePassed,
  appliesPatchInCwdWhenNested,
  errorsWhenInvalidVersionPassed,
  errorsWhenOlderVersionPassed,
  warnsWhenDependencyInSemverRange,
  fetchesEmptyPatchAndInstallsDeps,
  fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemote,
  fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemoteNested,
  cleansUpIfPatchingFails,
  worksWithNameIosAndNameAndroid,
};
