import {CLIError} from '@react-native-community/cli-tools';
import {Config, IOSProjectConfig} from '@react-native-community/cli-types';
import getArchitecture from '../../tools/getArchitecture';
import resolvePods from '../../tools/pods';
import {BuildFlags} from './buildOptions';
import {buildProject} from './buildProject';
import {getConfiguration} from './getConfiguration';
import {getXcodeProjectAndDir} from './getXcodeProjectAndDir';
import {BuilderCommand} from '../../types';

const createBuild =
  ({platformName}: BuilderCommand) =>
  async (_: Array<string>, ctx: Config, args: BuildFlags) => {
    const platform = ctx.project[platformName] as IOSProjectConfig;
    if (platform === undefined) {
      throw new CLIError(`Unable to find ${platform} platform config`);
    }

    let installedPods = false;
    if (platform?.automaticPodsInstallation || args.forcePods) {
      const isAppRunningNewArchitecture = platform?.sourceDir
        ? await getArchitecture(platform?.sourceDir)
        : undefined;

      await resolvePods(ctx.root, ctx.dependencies, platformName, {
        forceInstall: args.forcePods,
        newArchEnabled: isAppRunningNewArchitecture,
      });

      installedPods = true;
    }

    let {xcodeProject, sourceDir} = getXcodeProjectAndDir(
      platform,
      installedPods,
    );

    process.chdir(sourceDir);

    const {scheme, mode} = await getConfiguration(
      xcodeProject,
      sourceDir,
      args,
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
