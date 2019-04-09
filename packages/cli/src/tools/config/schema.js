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
 * Schema for CommandT
 */
const command = t.object({
  name: t.string().required(),
  description: t.string(),
  usage: t.string(),
  func: t.func().required(),
  options: t.array().items(
    t.object({
      command: t.string().required(),
      description: t.string(),
      parse: t.func(),
      default: t.alternatives().try([t.bool(), t.number(), t.string()]),
    }),
  ),
  examples: t.array().items(
    t.object({
      desc: t.string().required(),
      cmd: t.string().required(),
    }),
  ),
});

/**
 * Schema for UserDependencyConfigT
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
        hooks: map(t.string(), t.string()).default({}),
        params: t
          .array()
          .items(
            t.object({
              name: t.string(),
              type: t.string(),
              message: t.string(),
            }),
          )
          .default([]),
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
      .items(command)
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
    ).default({}),
    reactNativePath: t.string(),
    project: map(t.string(), t.any())
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
            packageName: t.string(),
            packageFolder: t.string(),
            mainFilePath: t.string(),
            stringsPath: t.string(),
            settingsGradlePath: t.string(),
            assetsPath: t.string(),
            buildGradlePath: t.string(),
          })
          .default({}),
      })
      .default(),
    assets: t
      .array()
      .items(t.string())
      .default([]),
    commands: t
      .array()
      .items(command)
      .default([]),
  })
  .default();
