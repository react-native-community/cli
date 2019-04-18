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
 * Schema for DependencyConfigT
 */
export const dependencyConfig = t
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
 * Schema for ProjectConfigT
 */
export const projectConfig = t
  .object({
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
    ),
    commands: t.array().items(t.string()),
    haste: t.object({
      providesModuleNodeModules: t.array().items(t.string()),
      platforms: t.array().items(t.string()),
    }),
    reactNativePath: t.string(),
    root: t.string(),
  })
  .default({});
