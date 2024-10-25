import {CLIError} from '@react-native-community/cli-tools';
import {Config, IOSProjectConfig} from '@react-native-community/cli-types';
import getArchitecture from '../../tools/getArchitecture';
import resolvePods from '../../tools/pods';
import {BuildFlags} from './buildOptions';
import {buildProject} from './buildProject';
import {getConfiguration} from './getConfiguration';
import {getXcodeProjectAndDir} from './getXcodeProjectAndDir';
import {BuilderCommand} from '../../types';
import {supportedPlatforms} from '../../config/supportedPlatforms';

const createBuild =
  ({platformName}: BuilderCommand) =>
  async (_: Array<string>, ctx: Config, args: BuildFlags) => {
    const platformConfig = ctx.project[platformName] as IOSProjectConfig;

    if (
      platformConfig === undefined ||
      supportedPlatforms[platformName] === undefined
    ) {
      throw new CLIError(`Unable to find ${platformName} platform config`);
    }

    let installedPods = false;
    if (platformConfig.automaticPodsInstallation || args.forcePods) {
      const isAppRunningNewArchitecture = platformConfig.sourceDir
        ? await getArchitecture(platformConfig.sourceDir)
        : undefined;

      await resolvePods(
        ctx.root,
        platformConfig.sourceDir,
        ctx.dependencies,
        platformName,
        {
          forceInstall: args.forcePods,
          newArchEnabled: isAppRunningNewArchitecture,
        },
      );

      installedPods = true;
    }

    let {xcodeProject, sourceDir} = getXcodeProjectAndDir(
      platformConfig,
      platformName,
      installedPods,
    );

    process.chdir(sourceDir);

    const {scheme, mode} = await getConfiguration(
      xcodeProject,
      sourceDir,
      args,
      platformName,
    );

    return buildProject(
      xcodeProject,
      platformName,
      undefined,
      mode,
      scheme,
      args,
    );
  };

export default createBuild;
