/**
 * @flow
 */
import t from 'joi';

const map = (key, value) =>
  t
    .object()
    .unknown(true)
    .pattern(key, value);

/**
 * Schema for DependencyUserConfigT
 */
export const dependencyUserConfig = t.object({
  dependency: t.object({
    platforms: map(t.string(), t.any()).keys({
      ios: t
        .object({
          project: t.string(),
          sharedLibraries: t.array().items(t.string()),
          libraryFolder: t.string(),
        })
        .allow(null),
      android: t
        .object({
          sourceDir: t.string(),
          manifestPath: t.string(),
          packageImportPath: t.string(),
          packageInstance: t.string(),
        })
        .allow(null),
    }),
    assets: t.array().items(t.string()),
    hooks: map(t.string(), t.string()),
    params: t.array().items(
      t.object({
        name: t.string(),
        type: t.string(),
        message: t.string(),
      }),
    ),
  }),
  platforms: map(t.string(), t.string()),
  commands: t.array().items(t.string()),
});

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
        platforms: map(t.string(), t.any()).keys({
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
        }),
        assets: t.array().items(t.string()),
        hooks: map(t.string(), t.string()),
        params: t.array().items(
          t.object({
            name: t.string(),
            type: t.string(),
            message: t.string(),
          }),
        ),
      })
      .allow(null),
  ).default({}),
  commands: t.array().items(t.string()),
  haste: t.object({
    providesModuleNodeModules: t.array().items(t.string()),
    platforms: t.array().items(t.string()),
  }),
  reactNativePath: t.string(),
  root: t.string(),
});
