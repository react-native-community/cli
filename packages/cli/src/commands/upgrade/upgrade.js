// @flow
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import semver from 'semver';
import execa from 'execa';
import type {ConfigT} from 'types';
import {logger, CLIError, fetch} from '@react-native-community/cli-tools';
import * as PackageManager from '../../tools/packageManager';
import installPods from '../../tools/installPods';
import legacyUpgrade from './legacyUpgrade';

type FlagsT = {
  legacy: boolean | void,
};

// https://react-native-community.github.io/upgrade-helper/?from=0.59.10&to=0.60.0-rc.3
const webDiffUrl = 'https://react-native-community.github.io/upgrade-helper';
const rawDiffUrl =
  'https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs';

const getLatestRNVersion = async (): Promise<string> => {
  logger.info('No version passed. Fetching latest...');
  // $FlowFixMe - this is public API
  const {stdout} = await execa('npm', ['info', 'react-native', 'version']);
  return stdout;
};

const getRNPeerDeps = async (
  version: string,
): Promise<{[key: string]: string}> => {
  // $FlowFixMe - this is public API
  const {stdout} = await execa('npm', [
    'info',
    `react-native@${version}`,
    'peerDependencies',
    '--json',
  ]);

  return JSON.parse(stdout);
};

const getPatch = async (currentVersion, newVersion, config) => {
  let patch;

  logger.info(`Fetching diff between v${currentVersion} and v${newVersion}...`);

  try {
    const {data} = await fetch(
      `${rawDiffUrl}/${currentVersion}..${newVersion}.diff`,
    );

    patch = data;
  } catch (error) {
    logger.error(error.message);
    logger.error(
      `Failed to fetch diff for react-native@${newVersion}. Maybe it's not released yet?`,
    );
    logger.info(
      `For available releases to diff see: ${chalk.underline.dim(
        'https://github.com/react-native-community/rn-diff-purge#diff-table-full-table-here',
      )}`,
    );
    return null;
  }

  let patchWithRenamedProjects = patch;

  Object.keys(config.project).forEach(platform => {
    if (!config.project[platform]) {
      return;
    }
    if (platform === 'ios') {
      patchWithRenamedProjects = patchWithRenamedProjects.replace(
        new RegExp('RnDiffApp', 'g'),
        // $FlowFixMe - poor typings of ProjectConfigIOST
        config.project[platform].projectName.replace('.xcodeproj', ''),
      );
    } else if (platform === 'android') {
      patchWithRenamedProjects = patchWithRenamedProjects
        .replace(
          new RegExp('com\\.rndiffapp', 'g'),
          // $FlowFixMe - poor typings of ProjectConfigAndroidT
          config.project[platform].packageName,
        )
        .replace(
          new RegExp('com\\.rndiffapp'.split('.').join('/'), 'g'),
          // $FlowFixMe - poor typings of ProjectConfigAndroidT
          config.project[platform].packageName.split('.').join('/'),
        );
    } else {
      logger.warn(
        `Unsupported platform: "${platform}". \`upgrade\` only supports iOS and Android.`,
      );
    }
  });

  return patchWithRenamedProjects;
};

const getVersionToUpgradeTo = async (argv, currentVersion, projectDir) => {
  const newVersion = argv[0]
    ? semver.valid(argv[0]) ||
      (semver.coerce(argv[0]) ? semver.coerce(argv[0]).version : null)
    : await getLatestRNVersion();

  if (!newVersion) {
    logger.error(
      `Provided version "${
        argv[0]
      }" is not allowed. Please pass a valid semver version`,
    );
    return null;
  }

  if (semver.gt(currentVersion, newVersion)) {
    logger.error(
      `Trying to upgrade from newer version "${currentVersion}" to older "${newVersion}"`,
    );
    return null;
  }
  if (semver.eq(currentVersion, newVersion)) {
    const {
      dependencies: {'react-native': version},
    } = require(path.join(projectDir, 'package.json'));

    if (semver.satisfies(newVersion, version)) {
      logger.warn(
        `Specified version "${newVersion}" is already installed in node_modules and it satisfies "${version}" semver range. No need to upgrade`,
      );
      return null;
    }
    logger.error(
      `Dependency mismatch. Specified version "${newVersion}" is already installed in node_modules and it doesn't satisfy "${version}" semver range of your "react-native" dependency. Please re-install your dependencies`,
    );
    return null;
  }

  return newVersion;
};

const installDeps = async (newVersion, projectDir) => {
  logger.info(
    `Installing "react-native@${newVersion}" and its peer dependencies...`,
  );
  const peerDeps = await getRNPeerDeps(newVersion);
  const deps = [
    `react-native@${newVersion}`,
    ...Object.keys(peerDeps).map(module => `${module}@${peerDeps[module]}`),
  ];
  await PackageManager.install(deps, {
    silent: true,
  });
  await execa('git', ['add', 'package.json']);
  try {
    await execa('git', ['add', 'yarn.lock']);
  } catch (error) {
    // ignore
  }
  try {
    await execa('git', ['add', 'package-lock.json']);
  } catch (error) {
    // ignore
  }
};

const installCocoaPodsDeps = async (projectDir, thirdPartyIOSDeps) => {
  if (process.platform === 'darwin') {
    try {
      logger.info(
        `Installing CocoaPods dependencies ${chalk.dim(
          '(this may take a few minutes)',
        )}`,
      );
      await installPods({
        projectName: projectDir.split('/').pop(),
        shouldUpdatePods: thirdPartyIOSDeps.length > 0,
      });
    } catch (error) {
      if (error.stderr) {
        logger.debug(
          `"pod install" or "pod repo update" failed. Error output:\n${
            error.stderr
          }`,
        );
      }
      logger.error(
        'Installation of CocoaPods dependencies failed. Try to install them manually by running "pod install" in "ios" directory after finishing upgrade',
      );
    }
  }
};

const applyPatch = async (
  currentVersion: string,
  newVersion: string,
  tmpPatchFile: string,
) => {
  const defaultExcludes = ['package.json'];
  let filesThatDontExist = [];
  let filesThatFailedToApply = [];
  // $FlowFixMe ThenableChildProcess is incompatible with Promise
  const {stdout: relativePathFromRoot} = await execa('git', [
    'rev-parse',
    '--show-prefix',
  ]);
  try {
    try {
      const excludes = defaultExcludes.map(
        e => `--exclude=${path.join(relativePathFromRoot, e)}`,
      );
      await execa('git', [
        'apply',
        // According to git documentation, `--binary` flag is turned on by
        // default. However it's necessary when running `git apply --check` to
        // actually accept binary files, maybe a bug in git?
        '--binary',
        '--check',
        tmpPatchFile,
        ...excludes,
        '-p2',
        '--3way',
        `--directory=${relativePathFromRoot}`,
      ]);
      logger.info('Applying diff...');
    } catch (error) {
      const errorLines = error.stderr.split('\n');
      filesThatDontExist = [
        ...errorLines
          .filter(x => x.includes('does not exist in index'))
          .map(x => x.replace(/^error: (.*): does not exist in index$/, '$1')),
      ].filter(Boolean);

      filesThatFailedToApply = errorLines
        .filter(x => x.includes('patch does not apply'))
        .map(x => x.replace(/^error: (.*): patch does not apply$/, '$1'))
        .filter(Boolean);

      logger.info('Applying diff...');
      logger.warn(
        `Excluding files that exist in the template, but not in your project:\n${filesThatDontExist
          .map(file => `  - ${chalk.bold(file)}`)
          .join('\n')}`,
      );
      if (filesThatFailedToApply.length) {
        logger.error(
          `Excluding files that failed to apply the diff:\n${filesThatFailedToApply
            .map(file => `  - ${chalk.bold(file)}`)
            .join(
              '\n',
            )}\nPlease make sure to check the actual changes after the upgrade command is finished.\nYou can find them in our Upgrade Helper web app: ${chalk.underline.dim(
            `${webDiffUrl}/?from=${currentVersion}&to=${newVersion}`,
          )}`,
        );
      }
    } finally {
      const excludes = [
        ...defaultExcludes,
        ...filesThatDontExist,
        ...filesThatFailedToApply,
      ].map(e => `--exclude=${path.join(relativePathFromRoot, e)}`);
      await execa('git', [
        'apply',
        tmpPatchFile,
        ...excludes,
        '-p2',
        '--3way',
        `--directory=${relativePathFromRoot}`,
      ]);
    }
  } catch (error) {
    if (error.stderr) {
      logger.debug(`"git apply" failed. Error output:\n${error.stderr}`);
    }
    logger.error(
      'Automatically applying diff failed. We did our best to automatically upgrade as many files as possible',
    );
    return false;
  }
  return true;
};

/**
 * Upgrade application to a new version of React Native.
 */
async function upgrade(argv: Array<string>, ctx: ConfigT, args: FlagsT) {
  if (args.legacy) {
    return legacyUpgrade.func(argv, ctx);
  }
  const tmpPatchFile = 'tmp-upgrade-rn.patch';
  const projectDir = ctx.root;
  const {version: currentVersion} = require(path.join(
    projectDir,
    'node_modules/react-native/package.json',
  ));
  const thirdPartyIOSDeps = Object.values(ctx.dependencies).filter(
    // $FlowFixMe
    dependency => dependency.platforms.ios,
  );

  const newVersion = await getVersionToUpgradeTo(
    argv,
    currentVersion,
    projectDir,
  );

  if (!newVersion) {
    return;
  }

  const patch = await getPatch(currentVersion, newVersion, ctx);

  if (patch === null) {
    return;
  }

  if (patch === '') {
    logger.info('Diff has no changes to apply, proceeding further');
    await installDeps(newVersion, projectDir);
    await installCocoaPodsDeps(projectDir, thirdPartyIOSDeps);

    logger.success(
      `Upgraded React Native to v${newVersion} 🎉. Now you can review and commit the changes`,
    );
    return;
  }
  let patchSuccess;

  try {
    fs.writeFileSync(tmpPatchFile, patch);
    patchSuccess = await applyPatch(currentVersion, newVersion, tmpPatchFile);
  } catch (error) {
    throw new Error(error.stderr || error);
  } finally {
    try {
      fs.unlinkSync(tmpPatchFile);
    } catch (e) {
      // ignore
    }
    const {stdout} = await execa('git', ['status', '-s']);
    if (!patchSuccess) {
      if (stdout) {
        logger.warn(
          'Continuing after failure. Some of the files are upgraded but you will need to deal with conflicts manually',
        );
        await installDeps(newVersion, projectDir);
        logger.info('Running "git status" to check what changed...');
        await execa('git', ['status'], {stdio: 'inherit'});
      } else {
        logger.error(
          'Patch failed to apply for unknown reason. Please fall back to manual way of upgrading',
        );
      }
    } else {
      await installDeps(newVersion, projectDir);
      await installCocoaPodsDeps(projectDir, thirdPartyIOSDeps);
      logger.info('Running "git status" to check what changed...');
      await execa('git', ['status'], {stdio: 'inherit'});
    }
    if (!patchSuccess) {
      if (stdout) {
        logger.warn(
          'Please run "git diff" to review the conflicts and resolve them',
        );
      }
      if (process.platform === 'darwin') {
        logger.warn(
          'After resolving conflicts don\'t forget to run "pod install" inside "ios" directory',
        );
      }
      logger.info(`You may find these resources helpful:
• Release notes: ${chalk.underline.dim(
        `https://github.com/facebook/react-native/releases/tag/v${newVersion}`,
      )}
• Manual Upgrade Helper: ${chalk.underline.dim(
        `${webDiffUrl}/?from=${currentVersion}&to=${newVersion}`,
      )}
• Git diff: ${chalk.underline.dim(
        `${rawDiffUrl}/${currentVersion}..${newVersion}.diff`,
      )}`);

      throw new CLIError(
        'Upgrade failed. Please see the messages above for details',
      );
    }
  }
  logger.success(
    `Upgraded React Native to v${newVersion} 🎉. Now you can review and commit the changes`,
  );
}
const upgradeCommand = {
  name: 'upgrade [version]',
  description:
    "Upgrade your app's template files to the specified or latest npm version using `rn-diff-purge` project. Only valid semver versions are allowed.",
  func: upgrade,
  options: [
    {
      name: '--legacy [boolean]',
      description:
        "Legacy implementation. Upgrade your app's template files to the latest version; run this after " +
        'updating the react-native version in your package.json and running npm install',
    },
  ],
};
export default upgradeCommand;
