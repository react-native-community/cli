import os from 'os';
import path from 'path';
import fs, {readdirSync} from 'fs-extra';
import {validateProjectName} from './validate';
import chalk from 'chalk';
import printRunInstructions from './printRunInstructions';
import {
  CLIError,
  logger,
  getLoader,
  Loader,
  cacheManager,
  prompt,
} from '@react-native-community/cli-tools';
import {installPods} from '@react-native-community/cli-platform-apple';
import {
  installTemplatePackage,
  getTemplateConfig,
  copyTemplate,
  executePostInitScript,
} from './template';
import {changePlaceholderInTemplate} from './editTemplate';
import * as PackageManager from '../../tools/packageManager';
import banner from './banner';
import TemplateAndVersionError from './errors/TemplateAndVersionError';
import {getBunVersionIfAvailable} from '../../tools/bun';
import {
  getNpmVersionIfAvailable,
  npmResolveConcreteVersion,
} from '../../tools/npm';
import {getYarnVersionIfAvailable} from '../../tools/yarn';
import {createHash} from 'crypto';
import {
  createGitRepository,
  checkGitInstallation,
  checkIfFolderIsGitRepo,
} from './git';
import semver from 'semver';
import {executeCommand} from '../../tools/executeCommand';
import DirectoryAlreadyExistsError from './errors/DirectoryAlreadyExistsError';
import {createTemplateUri} from './version';
import {TEMPLATE_COMMUNITY_REACT_NATIVE_VERSION} from './constants';
import type {Options} from './types';

const DEFAULT_VERSION = 'latest';

interface TemplateOptions {
  projectName: string;
  shouldBumpYarnVersion: boolean;
  templateUri: string;
  npm?: boolean;
  pm?: PackageManager.PackageManager;
  directory: string;
  projectTitle?: string;
  skipInstall?: boolean;
  packageName?: string;
  installCocoaPods?: string | boolean;
  version: string;
  replaceDirectory?: string | boolean;
  yarnConfigOptions?: Record<string, string>;
}

interface TemplateReturnType {
  didInstallPods?: boolean;
  replaceDirectory?: string | boolean;
}

// Here we are defining explicit version of Yarn to be used in the new project because in some cases providing `3.x` don't work.
const YARN_VERSION = '3.6.4';

const bumpYarnVersion = async (root: string) => {
  try {
    let yarnVersion = semver.parse(getYarnVersionIfAvailable());

    if (yarnVersion) {
      // `yarn set` is unsupported until 1.22, however it's a alias (yarnpkg/yarn/pull/7862) calling `policies set-version`.
      let setVersionArgs = ['set', 'version', YARN_VERSION];
      if (yarnVersion.major === 1 && yarnVersion.minor < 22) {
        setVersionArgs = ['policies', 'set-version', YARN_VERSION];
      }
      await executeCommand('yarn', setVersionArgs, {
        root,
        silent: !logger.isVerbose(),
      });

      // React Native doesn't support PnP, so we need to set nodeLinker to node-modules. Read more here: https://github.com/react-native-community/cli/issues/27#issuecomment-1772626767
      await executeCommand(
        'yarn',
        ['config', 'set', 'nodeLinker', 'node-modules'],
        {root, silent: !logger.isVerbose()},
      );
    }
  } catch (e) {
    logger.debug(e as string);
  }
};

function doesDirectoryExist(dir: string) {
  return fs.existsSync(dir);
}

function getConflictsForDirectory(directory: string) {
  return readdirSync(directory);
}

async function setProjectDirectory(
  directory: string,
  replaceDirectory: string,
) {
  const directoryExists = doesDirectoryExist(directory);

  if (replaceDirectory === 'false' && directoryExists) {
    throw new DirectoryAlreadyExistsError(directory);
  }

  let deleteDirectory = false;

  if (replaceDirectory === 'true' && directoryExists) {
    deleteDirectory = true;
  } else if (directoryExists) {
    const conflicts = getConflictsForDirectory(directory);

    if (conflicts.length > 0) {
      let warnMessage = `The directory ${chalk.bold(
        directory,
      )} contains files that will be overwritten:\n`;

      for (const conflict of conflicts) {
        warnMessage += `   ${conflict}\n`;
      }

      logger.warn(warnMessage);

      const {replace} = await prompt({
        type: 'confirm',
        name: 'replace',
        message: 'Do you want to replace existing files?',
      });

      deleteDirectory = replace;

      if (!replace) {
        throw new DirectoryAlreadyExistsError(directory);
      }
    }
  }

  try {
    if (deleteDirectory) {
      fs.removeSync(directory);
    }

    fs.mkdirSync(directory, {recursive: true});
    process.chdir(directory);
  } catch (error) {
    throw new CLIError(
      'Error occurred while trying to create project directory.',
      error as Error,
    );
  }

  return process.cwd();
}

function getTemplateName(cwd: string) {
  // We use package manager to infer the name of the template module for us.
  // That's why we get it from temporary package.json, where the name is the
  // first and only dependency (hence 0).
  const name = Object.keys(
    JSON.parse(fs.readFileSync(path.join(cwd, './package.json'), 'utf8'))
      .dependencies,
  )[0];
  return name;
}

//set cache to empty string to prevent installing cocoapods on freshly created project
function setEmptyHashForCachedDependencies(projectName: string) {
  cacheManager.set(
    projectName,
    'dependencies',
    createHash('md5').update('').digest('hex'),
  );
}

async function createFromTemplate({
  projectName,
  shouldBumpYarnVersion,
  templateUri,
  npm,
  pm,
  directory,
  projectTitle,
  skipInstall,
  packageName,
  installCocoaPods,
  replaceDirectory,
  yarnConfigOptions,
  version,
}: TemplateOptions): Promise<TemplateReturnType> {
  logger.debug('Initializing new project');
  // Only print out the banner if we're not in a CI
  if (!process.env.CI) {
    logger.log(banner(version !== DEFAULT_VERSION ? version : undefined));
  }
  let didInstallPods = String(installCocoaPods) === 'true';
  let packageManager = pm;

  if (pm) {
    packageManager = pm;
  } else {
    const userAgentPM = userAgentPackageManager();
    // if possible, use the package manager from the user agent. Otherwise fallback to default (yarn)
    packageManager = userAgentPM || 'yarn';
  }

  if (npm) {
    logger.warn(
      'Flag --npm is deprecated and will be removed soon. In the future, please use --pm npm instead.',
    );

    packageManager = 'npm';
  }

  // if the project with the name already has cache, remove the cache to avoid problems with pods installation
  cacheManager.removeProjectCache(projectName);

  const projectDirectory = await setProjectDirectory(
    directory,
    String(replaceDirectory),
  );

  const loader = getLoader({text: 'Downloading template'});
  const templateSourceDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rncli-init-template-'),
  );

  try {
    loader.start();

    await installTemplatePackage(
      templateUri,
      templateSourceDir,
      packageManager,
      yarnConfigOptions,
    );

    loader.succeed();
    loader.start('Copying template');

    const templateName = getTemplateName(templateSourceDir);
    const templateConfig = getTemplateConfig(templateName, templateSourceDir);
    await copyTemplate(
      templateName,
      templateConfig.templateDir,
      templateSourceDir,
    );

    loader.succeed();
    loader.start('Processing template');

    await changePlaceholderInTemplate({
      projectName,
      projectTitle,
      placeholderName: templateConfig.placeholderName,
      placeholderTitle: templateConfig.titlePlaceholder,
      packageName,
    });

    if (packageManager === 'yarn' && shouldBumpYarnVersion) {
      await bumpYarnVersion(projectDirectory);
    }

    loader.succeed();
    const {postInitScript} = templateConfig;
    if (postInitScript) {
      loader.info('Executing post init script ');
      await executePostInitScript(
        templateName,
        postInitScript,
        templateSourceDir,
      );
    }

    if (!skipInstall) {
      await installDependencies({
        packageManager,
        loader,
        root: projectDirectory,
      });

      if (process.platform === 'darwin') {
        const installPodsValue = String(installCocoaPods);

        if (installPodsValue === 'true') {
          didInstallPods = true;
          await installPods(loader);
          loader.succeed();
          setEmptyHashForCachedDependencies(projectName);
        } else if (installPodsValue === 'undefined') {
          const {installCocoapods} = await prompt({
            type: 'confirm',
            name: 'installCocoapods',
            message: `Do you want to install CocoaPods now? ${chalk.reset.dim(
              'Only needed if you run your project in Xcode directly',
            )}`,
          });
          didInstallPods = installCocoapods;

          if (installCocoapods) {
            await installPods(loader);
            loader.succeed();
            setEmptyHashForCachedDependencies(projectName);
          }
        }
      }
    } else {
      didInstallPods = false;
      loader.succeed('Dependencies installation skipped');
    }
  } catch (e) {
    loader.fail();
    if (e instanceof Error) {
      logger.error(
        'Installing pods failed. This doesn\'t affect project initialization and you can safely proceed. \nHowever, you will need to install pods manually when running iOS, follow additional steps in "Run instructions for iOS" section.\n',
      );
      logger.debug(e as any);
    }
    didInstallPods = false;
  } finally {
    fs.removeSync(templateSourceDir);
  }

  if (process.platform === 'darwin') {
    logger.info(
      `💡 To enable automatic CocoaPods installation when building for iOS you can create react-native.config.js with automaticPodsInstallation field. \n${chalk.reset.dim(
        `For more details, see ${chalk.underline(
          'https://github.com/react-native-community/cli/blob/main/docs/projects.md#projectiosautomaticpodsinstallation',
        )}`,
      )}
            `,
    );
  }

  return {didInstallPods};
}

async function installDependencies({
  packageManager,
  loader,
  root,
}: {
  packageManager: PackageManager.PackageManager;
  loader: Loader;
  root: string;
}) {
  loader.start('Installing dependencies');

  await PackageManager.installAll({
    packageManager,
    silent: true,
    root,
  });

  loader.succeed();
}

function checkPackageManagerAvailability(
  packageManager: PackageManager.PackageManager,
) {
  if (packageManager === 'bun') {
    return getBunVersionIfAvailable();
  } else if (packageManager === 'npm') {
    return getNpmVersionIfAvailable();
  } else if (packageManager === 'yarn') {
    return getYarnVersionIfAvailable();
  }

  return false;
}

async function createProject(
  projectName: string,
  directory: string,
  version: string,
  shouldBumpYarnVersion: boolean,
  options: Options,
): Promise<TemplateReturnType> {
  // Handle these cases (when community template is published and react-native >= 0.75
  //
  // +==================================================================+==========+===================+
  // | Arguments                                                        | Template |   React Native    |
  // +==================================================================+==========+===================+
  // | <None>                                                           | 0.74.x   | 0.74.5 (latest)   |
  // +------------------------------------------------------------------+----------+-------------------+
  // | --version next                                                   | 0.75.x   | 0.75.0-rc.1 (next)|
  // +------------------------------------------------------------------+----------+-------------------+
  // | --version 0.75.0                                                 | 0.75.x   | 0.75.0            |
  // +------------------------------------------------------------------+----------+-------------------+
  // | --template @react-native-community/template@0.75.1               | 0.75.1   | latest            |
  // +------------------------------------------------------------------+----------+-------------------+
  // | --template @react-native-community/template@0.75.1 --version 0.75| 0.75.1   | 0.75.x            |
  // +------------------------------------------------------------------+----------+-------------------+
  //
  // 1. If you specify `--version 0.75.0` and `@react-native-community/template@0.75.0` is *NOT*
  // published, then `init` will exit and suggest explicitly using the `--template` argument.
  //
  // 2. `--template` will always win over `--version` for the template.
  //
  // 3. For version < 0.75, the template ships with react-native.
  const templateUri = await createTemplateUri(options, version);

  logger.debug(`Template: '${templateUri}'`);

  return createFromTemplate({
    projectName,
    shouldBumpYarnVersion,
    templateUri,
    npm: options.npm,
    pm: options.pm,
    directory,
    projectTitle: options.title,
    skipInstall: options.skipInstall,
    packageName: options.packageName,
    installCocoaPods: options.installPods,
    version,
    replaceDirectory: options.replaceDirectory,
    yarnConfigOptions: options.yarnConfigOptions,
  });
}

function userAgentPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent && userAgent.startsWith('bun')) {
    return 'bun';
  }

  return null;
}

export default (async function initialize(
  [projectName]: Array<string>,
  options: Options,
) {
  if (!projectName) {
    const {projName} = await prompt({
      type: 'text',
      name: 'projName',
      message: 'How would you like to name the app?',
    });
    projectName = projName;
  }

  validateProjectName(projectName);

  let version = options.version ?? DEFAULT_VERSION;

  try {
    const updatedVersion = await npmResolveConcreteVersion(
      options.platformName ?? 'react-native',
      version,
    );
    logger.debug(`Mapped: ${version} -> ${updatedVersion}`);
    version = updatedVersion;
  } catch (e) {
    logger.debug(
      `Failed to get concrete version from '${version}': `,
      e as any,
    );
  }

  // From 0.75 it actually is useful to be able to specify both the template and react-native version.
  // This should only be used by people who know what they're doing.
  if (!!options.template && !!options.version) {
    // 0.75.0-nightly-20240618-5df5ed1a8' -> 0.75.0
    // 0.75.0-rc.1 -> 0.75.0
    const semverVersion = semver.coerce(version)?.version ?? version;
    if (semver.gte(semverVersion, TEMPLATE_COMMUNITY_REACT_NATIVE_VERSION)) {
      logger.warn(
        `Use ${chalk.bold('--template')} and ${chalk.bold(
          '--version',
        )} only if you know what you're doing. Here be dragons 🐉.`,
      );
    } else {
      throw new TemplateAndVersionError(options.template);
    }
  }

  const root = process.cwd();

  const directoryName = path.relative(root, options.directory || projectName);
  const projectFolder = path.join(root, directoryName);

  if (options.pm && !checkPackageManagerAvailability(options.pm)) {
    logger.error(
      'Seems like the package manager you want to use is not installed. Please install it or choose another package manager.',
    );
    return;
  }

  let shouldBumpYarnVersion = true;
  let shouldCreateGitRepository = false;

  const isGitAvailable = await checkGitInstallation();

  if (isGitAvailable) {
    const isFolderGitRepo = await checkIfFolderIsGitRepo(projectFolder);

    if (isFolderGitRepo) {
      shouldBumpYarnVersion = false;
    } else {
      shouldCreateGitRepository = true; // Initialize git repo after creating project
    }
  } else {
    logger.warn(
      'Git is not installed on your system. This might cause some features to work incorrectly.',
    );
  }

  const {didInstallPods} = await createProject(
    projectName,
    directoryName,
    version,
    shouldBumpYarnVersion,
    options,
  );

  if (shouldCreateGitRepository && !options.skipGitInit) {
    await createGitRepository(projectFolder);
  }

  printRunInstructions(projectFolder, projectName, {
    showPodsInstructions: !didInstallPods,
  });
});
