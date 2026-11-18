/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import path from 'path';
import pico from 'picocolors';
import fs from 'fs';
import findPodfilePath from './findPodfilePath';
import findSpmProjectDir from './findSpmProjectDir';
import findXcodeProject from './findXcodeProject';
import findPodspec from './findPodspec';
import findAllPodfilePaths from './findAllPodfilePaths';
import {
  IOSProjectParams,
  IOSDependencyParams,
  IOSProjectConfig,
  IOSDependencyConfig,
} from '@react-native-community/cli-types';
import {CLIError} from '@react-native-community/cli-tools';
import {BuilderCommand} from '../types';

/**
 * Returns project config by analyzing given folder and applying some user defaults
 * when constructing final object
 */
export const getProjectConfig =
  ({platformName}: BuilderCommand) =>
  (folder: string, userConfig: IOSProjectParams): IOSProjectConfig | null => {
    if (!userConfig) {
      return null;
    }

    const src = path.join(folder, userConfig.sourceDir ?? '');

    /**
     * `react-native spm` leaves the `Podfile` on disk, so the marker it injects
     * into the migrated Xcode project takes precedence: React Native comes from
     * either Swift Package Manager or CocoaPods, never both.
     */
    const spmSourceDir = findSpmProjectDir(src, platformName);
    const podfile = spmSourceDir ? null : findPodfilePath(src, platformName);
    const sourceDir = spmSourceDir ?? (podfile && path.dirname(podfile));

    if (!sourceDir) {
      return null;
    }

    const xcodeProject = findXcodeProject(fs.readdirSync(sourceDir));

    return {
      sourceDir,
      watchModeCommandParams: userConfig.watchModeCommandParams,
      xcodeProject,
      automaticPodsInstallation: userConfig.automaticPodsInstallation,
      assets: userConfig.assets ?? [],
      buildSystem: spmSourceDir ? 'spm' : 'cocoapods',
    };
  };

/**
 * Make getDependencyConfig follow the same pattern as getProjectConfig
 */
export const getDependencyConfig =
  ({}: BuilderCommand) =>
  (
    folder: string,
    userConfig: IOSDependencyParams | null = {},
  ): IOSDependencyConfig | null => {
    if (userConfig === null) {
      return null;
    }

    const podspecPath = findPodspec(folder);

    if (!podspecPath) {
      return null;
    }

    let version = 'unresolved';

    try {
      const packageJson = require(path.join(folder, 'package.json'));

      if (packageJson.version) {
        version = packageJson.version;
      }
    } catch {
      throw new CLIError(
        `Failed to locate package.json file from ${pico.underline(
          folder,
        )}. This is most likely issue with your node_modules folder being corrupted. Please force install dependencies and try again`,
      );
    }

    return {
      podspecPath,
      version,
      configurations: userConfig.configurations || [],
      scriptPhases: userConfig.scriptPhases || [],
    };
  };

export const findPodfilePaths = findAllPodfilePaths;
