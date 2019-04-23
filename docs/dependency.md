# Dependency

A dependency is a JavaScript package that is listed under dependencies present in the project's `package.json`. It can also contain native, platform-specific files that should be linked.

For example, `lodash` is a dependency that doesn't have any native code to link. On the other hand, `react-native-vector-icons` is a dependency that contains not only native code, but also font assets that the CLI should link.

By default, CLI analyses the folder structure inside the dependency and looks for assets and native files to link. This simple heuristic works in most of the cases. 

At the same time, a dependency can explicitly set its configuration in case CLI cannot infer it properly. A dependency can also define additional settings, such as a script to run after linking, in order to support some advanced use-cases. 

## How does it work?

A dependency can define the following `react-native.config.js` at the root:

```js
module.exports = {
  dependency: {
    platforms: {
      ios: {
        project: './Custom.xcodeproj'
      }
    }
    assets: ['./assets']
  }
};
```

> The above configuration informs CLI of the additional assets to link and about a custom project location.

## Dependency interface

The following type describes the configuration of a dependency that can be set under `dependency` key inside `react-native.config.js`.

```ts
type DependencyConfigT = {
  platforms: {
    [key: string]: any,
  },
  assets: string[],
  hooks: {
    [key: string]: string,
  }
};
```

> Note: This interface is subject to breaking changes. We may consider renaming some keys to simplify the configuration further. If you are going to use it, be prepared to update before we ship a stable 0.60.0 release.

### platforms

A map of specific settings that can be set per platform. The exact shape is always defined by the package that provides given platform. 

The following settings are available on iOS:
```ts
type DependencyParamsIOST = {
  project?: string,
  sharedLibraries?: string[],
  libraryFolder?: string
};
```
and on Android:
```ts
type DependencyParamsAndroidT = {
  sourceDir?: string,
  manifestPath?: string,
  packageImportPath?: string,
  packageInstance?: string
};
```

For settings applicable on other platforms, please consult their respective documentation.

In most cases, as a library author, you should not need to define any of these.

### assets

An array of assets folders to glob for files to link.

### hooks

A map where key is the name of a hook and value is the path to a file to execute. 

For example, `link` command supports `prelink` and `postlink` hooks to run before and after linking is done.

These are the only ones supported by CLI at the moment. Depending on the packages used in your project, you may find other hooks supported to.

> Note: This has nothing to do with React Hooks.

## Migrating from `rnpm` configuration

The changes are mostly cosmetic so the migration should be pretty straight-forward.

### Changing the configuration

Properties were renamed. Look at the following example for the differences.

```json
{
  "rnpm": {
    "ios": {},
    "android": {},
    "assets": ["./path-to-assets"],
    "hooks": {
      "prelink": "./path-to-a-postlink-hook"
    }
  }
}
```

to `react-native.config.js`

```js
module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {},
    },
    assets: ['./path-to-assets'],
    hooks: {
      prelink: './path-to-a-postlink-hook'
    }
  }
};
```

### Asking for params while linking has been removed

If your library needs it, do not upgrade over to the new config format.

If you want to ask users for additional settings, consider setting a custom `postlink` hook, just like [`react-native-code-push`](https://github.com/Microsoft/react-native-code-push/blob/master/package.json#L53).
