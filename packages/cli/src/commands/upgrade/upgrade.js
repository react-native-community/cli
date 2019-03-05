// @flow
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import semver from 'semver';
import execa from 'execa';
import type {ContextT} from '../../tools/types.flow';
import logger from '../../tools/logger';
import PackageManager from '../../tools/PackageManager';
import {fetch} from './helpers';
import legacyUpgrade from './legacyUpgrade';

type FlagsT = {
  legacy: boolean,
};

const rnDiffPurgeUrl = 'https://github.com/pvinis/rn-diff-purge';

const getLatestRNVersion = async (): Promise<string> => {
  logger.info('No version passed. Fetching latest...');
  const {stdout} = await execa('npm', ['info', 'react-native', 'version']);
  return stdout;
};

const getRNPeerDeps = async (
  version: string,
): Promise<{[key: string]: string}> => {
  const {stdout} = await execa('npm', [
    'info',
    `react-native@${version}`,
    'peerDependencies',
    '--json',
  ]);

  return JSON.parse(stdout);
};

const getPatch = async (currentVersion, newVersion, projectDir) => {
  let patch;

  const rnDiffAppName = 'RnDiffApp';
  const {name} = require(path.join(projectDir, 'package.json'));

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
      'For available releases to diff see: https://github.com/pvinis/rn-diff-purge#version-changes',
    );
    return null;
  }

  return patch
    .replace(new RegExp(rnDiffAppName, 'g'), name)
    .replace(new RegExp(rnDiffAppName.toLowerCase(), 'g'), name.toLowerCase());
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

const installDeps = async (newVersion, projectDir, patchSuccess) => {
  if (!patchSuccess) {
    logger.warn(
      'Continuing after failure. Most of the files are upgraded but you will need to deal with some conflicts manually',
    );
  }
  logger.info(
    `Installing react-native@${newVersion} and its peer dependencies...`,
  );
  const peerDeps = await getRNPeerDeps(newVersion);
  const pm = new PackageManager({projectDir});
  const deps = [
    `react-native@${newVersion}`,
    ...Object.keys(peerDeps).map(module => `${module}@${peerDeps[module]}`),
  ];
  await pm.install(deps, {silent: true});
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
  try {
    try {
      const excludes = filesToExclude.map(e => `--exclude=${e}`);
      await execa('git', [
        'apply',
        '--check',
        tmpPatchFile,
        ...excludes,
        '-p2',
        '--3way',
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
      const excludes = filesToExclude.map(e => `--exclude=${e}`);
      await execa('git', ['apply', tmpPatchFile, ...excludes, '-p2', '--3way']);
    }
  } catch (error) {
    if (error.stderr) {
      logger.log(`${chalk.dim(error.stderr.trim())}`);
    }
    logger.error('Automatically applying diff failed');
    logger.info(
      `Here's the diff we tried to apply: ${rnDiffPurgeUrl}/compare/version/${currentVersion}...version/${newVersion}`,
    );
    logger.info(
      `You may find release notes helpful: https://github.com/facebook/react-native/releases/tag/v${newVersion}`,
    );
    return false;
  }
  return true;
};

/**
 * Upgrade application to a new version of React Native.
 */
async function upgrade(argv: Array<string>, ctx: ContextT, args: FlagsT) {
  if (args.legacy) {
    return legacyUpgrade.func(argv, ctx);
  }
  const rnDiffGitAddress = 'https://github.com/pvinis/rn-diff-purge.git';
  const tmpRemote = 'tmp-rn-diff-purge';
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

  const patch = await getPatch(currentVersion, newVersion, projectDir);

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
    await execa('git', ['remote', 'add', tmpRemote, rnDiffGitAddress]);
    await execa('git', ['fetch', '--no-tags', tmpRemote]);
    patchSuccess = await applyPatch(currentVersion, newVersion, tmpPatchFile);
    if (!patchSuccess) {
      return;
    }
  } catch (error) {
    throw new Error(error.stderr || error);
  } finally {
    try {
      fs.unlinkSync(tmpPatchFile);
    } catch (e) {
      // ignore
    }
    await installDeps(newVersion, projectDir, patchSuccess);
    logger.info('Running "git status" to check what changed...');
    await execa('git', ['status'], {stdio: 'inherit'});
    await execa('git', ['remote', 'remove', tmpRemote]);

    if (!patchSuccess) {
      logger.warn(
        'Please run "git diff" to review the conflicts and resolve them',
      );
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
      command: '--legacy',
      description:
        "Legacy implementation. Upgrade your app's template files to the latest version; run this after " +
        'updating the react-native version in your package.json and running npm install',
    },
  ],
};
export default upgradeCommand;
