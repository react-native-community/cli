import {
  CLIError,
  getLoader,
  logger,
  prompt,
} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import {join} from 'path';
import {readFileSync} from 'fs';
import chalk from 'chalk';
import {install, PackageManager} from './../../tools/packageManager';
import npmFetch from 'npm-registry-fetch';
import semver from 'semver';
import {checkGitInstallation, isGitTreeDirty} from '../init/git';
import {changePlaceholderInTemplate} from '../init/editTemplate';
import {
  copyTemplate,
  executePostInitScript,
  getTemplateConfig,
  installTemplatePackage,
} from '../init/template';
import {tmpdir} from 'os';
import {mkdtempSync} from 'graceful-fs';
import {existsSync} from 'fs';
import {getNpmRegistryUrl} from '../../tools/npm';

type Options = {
  packageName: string;
  version: string;
  pm: PackageManager;
  title: string;
};

const NPM_REGISTRY_URL = getNpmRegistryUrl();

const getAppName = async (root: string) => {
  logger.log(`Reading ${chalk.cyan('name')} from package.json…`);
  const pkgJsonPath = join(root, 'package.json');

  if (!pkgJsonPath) {
    throw new CLIError(`Unable to find package.json inside ${root}`);
  }

  let name;

  try {
    name = JSON.parse(readFileSync(pkgJsonPath, 'utf8')).name;
  } catch (e) {
    throw new CLIError(`Failed to read ${pkgJsonPath} file.`, e as Error);
  }

  if (!name) {
    const appJson = join(root, 'app.json');
    if (appJson) {
      logger.log(`Reading ${chalk.cyan('name')} from app.json…`);
      try {
        name = JSON.parse(readFileSync(appJson, 'utf8')).name;
      } catch (e) {
        throw new CLIError(`Failed to read ${pkgJsonPath} file.`, e as Error);
      }
    }

    if (!name) {
      throw new CLIError('Please specify name in package.json or app.json.');
    }
  }

  return name;
};

const getPackageMatchingVersion = async (
  packageName: string,
  version: string,
) => {
  const npmResponse = await npmFetch.json(packageName, {
    registry: NPM_REGISTRY_URL,
  });

  if ('dist-tags' in npmResponse) {
    const distTags = npmResponse['dist-tags'] as Record<string, string>;
    if (version in distTags) {
      return distTags[version];
    }
  }

  if ('versions' in npmResponse) {
    const versions = Object.keys(
      npmResponse.versions as Record<string, unknown>,
    );
    if (versions.length > 0) {
      const candidates = versions
        .filter((v) => semver.satisfies(v, version))
        .sort(semver.rcompare);

      if (candidates.length > 0) {
        return candidates[0];
      }
    }
  }

  throw new Error(
    `Cannot find matching version of ${packageName} to react-native${version}, please provide version manually with --version flag.`,
  );
};

// From React Native 0.75 template is not longer inside `react-native` core,
// so we need to map package name (fork) to template name

const getTemplateNameFromPackageName = (packageName: string) => {
  switch (packageName) {
    case '@callstack/react-native-visionos':
    case 'react-native-visionos':
      return '@callstack/visionos-template';
    default:
      return packageName;
  }
};

async function addPlatform(
  [packageName]: string[],
  {root, reactNativeVersion}: Config,
  {version, pm, title}: Options,
) {
  if (!packageName) {
    throw new CLIError('Please provide package name e.g. react-native-macos');
  }

  const templateName = getTemplateNameFromPackageName(packageName);
  const isGitAvailable = await checkGitInstallation();

  if (isGitAvailable) {
    const dirty = await isGitTreeDirty(root);

    if (dirty) {
      logger.warn(
        'Your git tree is dirty. We recommend committing or stashing changes first.',
      );
      const {proceed} = await prompt({
        type: 'confirm',
        name: 'proceed',
        message: 'Would you like to proceed?',
      });

      if (!proceed) {
        return;
      }

      logger.info('Proceeding with the installation');
    }
  }

  const projectName = await getAppName(root);

  const matchingVersion = await getPackageMatchingVersion(
    packageName,
    version ?? reactNativeVersion,
  );

  logger.log(
    `Found matching version ${chalk.cyan(matchingVersion)} for ${chalk.cyan(
      packageName,
    )}`,
  );

  const loader = getLoader({
    text: `Installing ${packageName}@${matchingVersion}`,
  });

  loader.start();

  try {
    await install([`${packageName}@${matchingVersion}`], {
      packageManager: pm,
      silent: true,
      root,
    });
    loader.succeed();
  } catch (error) {
    loader.fail();
    throw new CLIError(
      `Failed to install package ${packageName}@${matchingVersion}`,
      (error as Error).message,
    );
  }

  loader.start(
    `Installing template packages from ${templateName}@0${matchingVersion}`,
  );

  const templateSourceDir = mkdtempSync(join(tmpdir(), 'rncli-init-template-'));

  try {
    await installTemplatePackage(
      `${templateName}@0${matchingVersion}`,
      templateSourceDir,
      pm,
    );
    loader.succeed();
  } catch (error) {
    loader.fail();
    throw new CLIError(
      `Failed to install template packages from ${templateName}@0${matchingVersion}`,
      (error as Error).message,
    );
  }

  loader.start('Copying template files');

  const templateConfig = getTemplateConfig(templateName, templateSourceDir);

  if (!templateConfig.platforms) {
    throw new CLIError(
      `Template ${templateName} is missing "platforms" in its "template.config.js"`,
    );
  }

  for (const platform of templateConfig.platforms) {
    if (existsSync(join(root, platform))) {
      loader.fail();
      throw new CLIError(
        `Platform ${platform} already exists in the project. Directory ${join(
          root,
          platform,
        )} is not empty.`,
      );
    }

    await copyTemplate(
      templateName,
      templateConfig.templateDir,
      templateSourceDir,
      platform,
    );
  }

  loader.succeed();
  loader.start('Processing template');

  for (const platform of templateConfig.platforms) {
    await changePlaceholderInTemplate({
      projectName,
      projectTitle: title,
      placeholderName: templateConfig.placeholderName,
      placeholderTitle: templateConfig.titlePlaceholder,
      projectPath: join(root, platform),
    });
  }

  loader.succeed();

  const {postInitScript} = templateConfig;
  if (postInitScript) {
    logger.debug('Executing post init script ');
    await executePostInitScript(
      templateName,
      postInitScript,
      templateSourceDir,
    );
  }
}

export default addPlatform;
