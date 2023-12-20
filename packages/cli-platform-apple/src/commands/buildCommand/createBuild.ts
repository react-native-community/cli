import fs from 'fs';
import {CLIError} from '@react-native-community/cli-tools';
import {Config, IOSProjectConfig} from '@react-native-community/cli-types';
import getArchitecture from '../../tools/getArchitecture';
import resolvePods from '../../tools/pods';
import {BuildFlags} from './buildOptions';
import {buildProject} from './buildProject';
import {getConfiguration} from './getConfiguration';
import {getXcodeProjectAndDir} from './getXcodeProjectAndDir';
import {BuilderCommand} from '../../types';
import findXcodeProject from '../../config/findXcodeProject';

const createBuild =
  ({platformName}: BuilderCommand) =>
  async (_: Array<string>, ctx: Config, args: BuildFlags) => {
    const platform = ctx.project[platformName] as IOSProjectConfig;
    if (platform === undefined) {
      throw new CLIError(`Unable to find ${platform} platform config`);
    }

    let {xcodeProject, sourceDir} = getXcodeProjectAndDir(platform);

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

    // if project is freshly created, revisit Xcode project to verify Pods are installed correctly.
    // This is needed because ctx project is created before Pods are installed, so it might have outdated information.
    if (installedPods) {
      const recheckXcodeProject = findXcodeProject(fs.readdirSync(sourceDir));
      if (recheckXcodeProject) {
        xcodeProject = recheckXcodeProject;
      }
    }

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
