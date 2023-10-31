/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Config} from '@react-native-community/cli-types';
import {buildProject} from './buildProject';
import {BuildFlags, buildOptions} from './buildOptions';
import {getConfiguration} from './getConfiguration';
import {getXcodeProjectAndDir} from './getXcodeProjectAndDir';
import resolvePods from '../../tools/pods';
import getArchitecture from '../../tools/getArchitecture';

async function buildIOS(_: Array<string>, ctx: Config, args: BuildFlags) {
  const {xcodeProject, sourceDir} = getXcodeProjectAndDir(ctx.project.ios);

  if (ctx.project.ios?.automaticPodsInstallation || args.forcePods) {
    const isAppRunningNewArchitecture = ctx.project.ios?.sourceDir
      ? await getArchitecture(ctx.project.ios?.sourceDir)
      : undefined;

    await resolvePods(ctx.root, ctx.dependencies, {
      forceInstall: args.forcePods,
      newArchEnabled: isAppRunningNewArchitecture,
    });
  }

  process.chdir(sourceDir);

  const {scheme, mode} = await getConfiguration(xcodeProject, sourceDir, args);

  return buildProject(xcodeProject, undefined, mode, scheme, args);
}

export default {
  name: 'build-ios',
  description: 'builds your app for iOS platform',
  func: buildIOS,
  examples: [
    {
      desc: 'Build the app for all iOS devices in Release mode',
      cmd: 'npx react-native build-ios --mode "Release"',
    },
  ],
  options: buildOptions,
};
