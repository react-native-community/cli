// @flow
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import semver from 'semver';
import execa from 'execa';
import type {ConfigT} from '../../tools/config/types.flow';
import {logger} from '@react-native-community/cli-tools';
import * as PackageManager from '../../tools/packageManager';
import {fetch} from '../../tools/fetch';
import legacyUpgrade from './legacyUpgrade';

type FlagsT = {
  legacy: boolean | void,
};

const rnDiffPurgeUrl =
  'https://github.com/react-native-community/rn-diff-purge';

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
    patch = await fetch(
      `${rnDiffPurgeUrl}/compare/version/${currentVersion}...version/${newVersion}.diff`,
    );
  } catch (error) {
    logger.error(
      `Failed to fetch diff for react-native@${newVersion}. Maybe it's not released yet?`,
    );
    logger.info(
      'For available releases to diff see: https://github.com/react-native-community/rn-diff-purge#version-changes',
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

  if (currentVersion > newVersion) {
    logger.error(
      `Trying to upgrade from newer version "${currentVersion}" to older "${newVersion}"`,
    );
    return null;
  }
  if (currentVersion === newVersion) {
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

const applyPatch = async (
  currentVersion: string,
  newVersion: string,
  tmpPatchFile: string,
) => {
  let filesToExclude = ['package.json'];
  // $FlowFixMe ThenableChildProcess is incompatible with Promise
  const {stdout: relativePathFromRoot} = await execa('git', [
    'rev-parse',
    '--show-prefix',
  ]);
  try {
    try {
      const excludes = filesToExclude.map(
        e => `--exclude=${path.join(relativePathFromRoot, e)}`,
      );
      await execa('git', [
        'apply',
        '--check',
        tmpPatchFile,
        ...excludes,
        '-p2',
        '--3way',
        `--directory=${relativePathFromRoot}`,
      ]);
      logger.info('Applying diff...');
    } catch (error) {
      filesToExclude = [
        ...filesToExclude,
        ...error.stderr
          .split('\n')
          .filter(x => x.includes('does not exist in index'))
          .map(x => x.replace(/^error: (.*): does not exist in index$/, '$1')),
      ].filter(Boolean);

      logger.info(`Applying diff (excluding: ${filesToExclude.join(', ')})...`);
    } finally {
      const excludes = filesToExclude.map(
        e => `--exclude=${path.join(relativePathFromRoot, e)}`,
      );
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
      logger.log(`${chalk.dim(error.stderr.trim())}`);
    }
    logger.error('Automatically applying diff failed');
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
          'Continuing after failure. Most of the files are upgraded but you will need to deal with some conflicts manually',
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
      logger.info('Running "git status" to check what changed...');
      await execa('git', ['status'], {stdio: 'inherit'});
    }
    if (!patchSuccess) {
      if (stdout) {
        logger.warn(
          'Please run "git diff" to review the conflicts and resolve them',
        );
      }
      logger.info(`You may find these resources helpful:
• Release notes: ${chalk.underline.dim(
        `https://github.com/facebook/react-native/releases/tag/v${newVersion}`,
      )}
• Comparison between versions: ${chalk.underline.dim(
        `${rnDiffPurgeUrl}/compare/version/${currentVersion}..version/${newVersion}`,
      )}
• Git diff: ${chalk.underline.dim(
        `${rnDiffPurgeUrl}/compare/version/${currentVersion}..version/${newVersion}.diff`,
      )}`);

      throw new Error(
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
      command: '--legacy [boolean]',
      description:
        "Legacy implementation. Upgrade your app's template files to the latest version; run this after " +
        'updating the react-native version in your package.json and running npm install',
    },
  ],
};
export default upgradeCommand;
