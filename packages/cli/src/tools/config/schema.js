/**
 * @flow
 */
import t from 'joi';
import {fromPairs} from 'lodash';

const map = (key, value) =>
  t
    .object()
    .unknown(true)
    .pattern(key, value);

const obj = keys => fromPairs(keys.map(key => [key, undefined]));

/**
 * Schema for DependencyUserConfigT
 */
export const dependencyUserConfig = t
  .object({
    dependency: t
      .object({
        platforms: map(t.string(), t.any())
          .keys({
            ios: t
              .object({
                project: t.string(),
                sharedLibraries: t.array().items(t.string()),
                libraryFolder: t.string(),
              })
              .default({}),
            android: t
              .object({
                sourceDir: t.string(),
                manifestPath: t.string(),
                packageImportPath: t.string(),
                packageInstance: t.string(),
              })
              .default({}),
          })
          .default(),
        assets: t
          .array()
          .items(t.string())
          .default([]),
        hooks: map(t.string(), t.string()).default(),
        params: t
          .array()
          .items(
            t.object({
              name: t.string(),
              type: t.string(),
              message: t.string(),
            }),
          )
          .default(),
      })
      .default(),
    platforms: map(
      t.string(),
      t.object({
        dependencyConfig: t.func(),
        projectConfig: t.func(),
        linkConfig: t.func(),
      }),
    ).default(),
    commands: t
      .array()
      .items(t.string())
      .default([]),
  })
  .default();

/**
 * Schema for LegacyDependencyUserConfigT
 */
export const legacyDependencyConfig = t.object({
  plugin: t.alternatives().try(t.array().items(t.string()), t.string()),
  platform: t.string(),
  haste: t.object({
    platforms: t.array().items(t.string()),
    providesModuleNodeModules: t.array().items(t.string()),
  }),
  assets: t.reach(dependencyUserConfig, 'dependency.assets'),
  commands: t.reach(dependencyUserConfig, 'dependency.hooks'),
  android: t.reach(dependencyUserConfig, 'dependency.platforms.android'),
  ios: t.reach(dependencyUserConfig, 'dependency.platforms.ios'),
  params: t.reach(dependencyUserConfig, 'dependency.params'),
});

/**
 * Schema for ProjectUserConfigT
 */
export const projectUserConfig = t.object({
  dependencies: map(
    t.string(),
    t
      .object({
        platforms: map(t.string(), t.any())
          .keys({
            ios: t
              .object({
                sourceDir: t.string(),
                folder: t.string(),
                pbxprojPath: t.string(),
                podfile: t.string(),
                podspec: t.string(),
                projectPath: t.string(),
                projectName: t.string(),
                libraryFolder: t.string(),
                sharedLibraries: t.array().items(t.string()),
              })
              .allow(null),
            android: t
              .object({
                sourceDir: t.string(),
                folder: t.string(),
                packageImportPath: t.string(),
                packageInstance: t.string(),
              })
              .allow(null),
          })
          .default(),
        assets: t
          .array()
          .items(t.string())
          .default([]),
        hooks: map(t.string(), t.string()).default([]),
        params: t.array().items(
          t
            .object({
              name: t.string(),
              type: t.string(),
              message: t.string(),
            })
            .default(),
        ),
      })
      .allow(null),
  ).default(),
  commands: t
    .array()
    .items(t.string())
    .default([]),
  haste: t
    .object({
      providesModuleNodeModules: t
        .array()
        .items(t.string())
        .default([]),
      platforms: t
        .array()
        .items(t.string())
        .default([]),
    })
    .default(),
  reactNativePath: t.string(),
  root: t.string(),
});
