import * as t from '@hapi/joi';
import {SchemaLike} from '@hapi/joi';

const map = (key: RegExp | SchemaLike, value: SchemaLike) =>
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
    t
      .object({
        name: t.string().required(),
        description: t.string(),
        parse: t.func(),
        default: t
          .alternatives()
          .try([t.bool(), t.number(), t.string().allow(''), t.func()]),
      })
      .rename('command', 'name', {ignoreUndefined: true}),
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
              // IOSDependencyParams
              .object({
                project: t.string(),
                podspecPath: t.string(),
                scriptPhases: t.array().items(t.object()),
              })
              .default({}),
            android: t
              // AndroidDependencyParams
              .object({
                sourceDir: t.string(),
                appName: t.string(),
                manifestPath: t.string(),
                packageImportPath: t.string(),
                packageInstance: t.string(),
                packageName: t.string(),
              })
              .default({}),
          })
          .default(),
      })
      .default(),
    platforms: map(
      t.string(),
      t.object({
        dependencyConfig: t.func(),
        projectConfig: t.func(),

        // Leaving so that 3rd party platforms don't fail. To be removed in 5.x
        linkConfig: t.any(),
      }),
    ).default({}),
    commands: t
      .array()
      .items(command)
      .default([]),
  })
  .unknown(true)
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
          root: t.string(),
          platforms: map(t.string(), t.any()).keys({
            ios: t
              // IOSDependencyConfig
              .object({
                sourceDir: t.string(),
                podspecPath: t.string(),
                scriptPhases: t.array().items(t.object()),
              })
              .allow(null),
            android: t
              // AndroidDependencyConfig
              .object({
                sourceDir: t.string(),
                packageName: t.string(),
                packageImportPath: t.string(),
                packageInstance: t.string(),
              })
              .allow(null),
          }),
        })
        .allow(null),
    ).default({}),
    reactNativePath: t.string(),
    project: map(t.string(), t.any())
      .keys({
        ios: t
          // IOSProjectParams
          .object({
            project: t.string(),
            scriptPhases: t.array().items(t.object()),
          })
          .default({}),
        android: t
          // AndroidProjectParams
          .object({
            sourceDir: t.string(),
            appName: t.string(),
            manifestPath: t.string(),
            packageName: t.string(),
          })
          .default({}),
      })
      .default(),
    commands: t
      .array()
      .items(command)
      .default([]),
    platforms: map(
      t.string(),
      t.object({
        dependencyConfig: t.func(),
        projectConfig: t.func(),
      }),
    ).default({}),
  })
  .unknown(true)
  .default();
