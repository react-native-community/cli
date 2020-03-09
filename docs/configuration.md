# Configuration

React Native CLI has a configuration mechanism that allows changing its behavior and providing additional features.

> Note: Configuring CLI used to be possible via `rn-cli.config.js` (that has been renamed to `metro.config.js`) and never documented `rnpm` entry on the `package.json`. We have provided migration guides where possible.

React Native CLI can be configured by creating a `react-native.config.js` at the root of the project. Depending on the type of a package, the set of valid properties is different.

Check the documentation for

- [projects](./projects.md)
- [dependencies](./dependencies.md)
- [platforms](./platforms.md)
- [plugins](./plugins.md)

to learn more about different types of configuration and features available.

## Migration guide

`"rnpm"` is deprecated and support for it is removed since v4.x of the CLI.

> **Important**: Proceed further only if your project uses `"rnpm"` in `package.json`.

There are different kinds of React Native projects, including apps, libraries and platforms. For each we prepared a brief "before & after" of the configuration shape with legacy `"rnpm"` and current `react-native.config.js`. Please mind that all configuration entries are optional.

### Apps

`package.json` entry:

```json
{
  "rnpm": {
    "ios": {},
    "android": {},
    "assets": ["./path-to-assets"],
    "plugin": "./path-to-commands.js"
  }
}
```

becomes `react-native.config.js`

```js
module.exports = {
  project: {
    ios: {},
    android: {}, // grouped into "project"
  },
  assets: ['./path-to-assets'], // stays the same
  commands: require('./path-to-commands.js'), // formerly "plugin", returns an array of commands
};
```

### Libraries

`package.json` entry:

```json
{
  "rnpm": {
    "ios": {},
    "android": {},
    "assets": ["./path-to-assets"],
    "hooks": {
      "prelink": "./path-to-a-prelink-hook"
    }
  }
}
```

becomes `react-native.config.js`:

```js
module.exports = {
  // config for a library is scoped under "dependency" key
  dependency: {
    platforms: {
      ios: {},
      android: {}, // projects are grouped into "platforms"
    },
    assets: ['./path-to-assets'], // stays the same
    // hooks are considered anti-pattern, please avoid them
    hooks: {
      prelink: './path-to-a-prelink-hook',
    },
  },
};
```

You'll find more details in [dependencies](./dependencies.md) docs.

### Out-of-tree platforms

`package.json` entry:

```json
{
  "rnpm": {
    "haste": {
      "platforms": ["windows"],
      "providesModuleNodeModules": ["react-native-windows"]
    },
    "platform": "./local-cli/platform.js"
  }
}
```

becomes `react-native.config.js`

```js
module.exports = {
  platforms: {
    // grouped under "platforms" entry
    windows: require('./local-cli/platform.js').windows,
  },
  // "haste" is no longer needed
};
```

You'll find more details in [platforms](./platforms.md) docs.
