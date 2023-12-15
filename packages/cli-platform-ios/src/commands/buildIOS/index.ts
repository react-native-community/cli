/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Config, ProjectConfig} from '@react-native-community/cli-types';
import {buildProject} from './buildProject';
import {BuildFlags, buildOptions} from './buildOptions';
import {getConfiguration} from './getConfiguration';
import {getXcodeProjectAndDir} from './getXcodeProjectAndDir';
import resolvePods from '../../tools/pods';
import getArchitecture from '../../tools/getArchitecture';
import {CLIError} from '@react-native-community/cli-tools';

export const commandBuilder =
  (platformName: string) =>
  async (_: Array<string>, ctx: Config, args: BuildFlags) => {
    const platform = ctx.project[platformName] as ProjectConfig['ios'];
    if (platform === undefined) {
      throw new CLIError(`Unable to find ${platform} platform config`);
    }

    const {xcodeProject, sourceDir} = getXcodeProjectAndDir(platform);

    if (platform?.automaticPodsInstallation || args.forcePods) {
      const isAppRunningNewArchitecture = platform?.sourceDir
        ? await getArchitecture(platform?.sourceDir)
        : undefined;

      await resolvePods(ctx.root, ctx.dependencies, {
        forceInstall: args.forcePods,
        newArchEnabled: isAppRunningNewArchitecture,
      });
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

export default {
  name: 'build-ios',
  description: 'builds your app for iOS platform',
  func: commandBuilder('ios'),
  examples: [
    {
      desc: 'Build the app for all iOS devices in Release mode',
      cmd: 'npx react-native build-ios --mode "Release"',
    },
  ],
  options: buildOptions,
};
