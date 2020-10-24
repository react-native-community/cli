# Plugins

Plugin is a JavaScript package that extends built-in React Native CLI features. It can provide an array of additional commands to run or platforms to target.

For example, `react-native-windows` package is a plugin that provides `react-native run-windows` command and `windows` platform.

Details of this particular integration as well as how to provide an additional platform for React Native were described in a [`dedicated section`](./platforms.md) about platforms.

## How does it work?

Except for React Native dependencies, where configuration is implicit, each package needs to have a `react-native.config.js` at the root folder in order to be discovered by the CLI as a plugin.

```js
module.exports = {
  commands: [
    {
      name: 'foo-command',
      func: () => console.log('It worked'),
    },
  ],
};
```

> Above is an example of a plugin that exports a command named `foo-command` that can be executed with `react-native foo-command` and logs "It worked" and exits.

At the startup, React Native CLI reads configuration from all dependencies listed in `package.json` and reduces them into a single configuration.

At the end, an array of commands concatenated from all plugins is passed on to the CLI to be loaded after built-in commands.

> See [`healthChecks`](./healthChecks.md) for information on how plugins can provide additional health checks for `react-native doctor`.

## Command interface

```ts
type Command = {
  name: string,
  description?: string,
  func: (argv: Array<string>, config: ConfigT, args: Object) => ?Promise<void>,
  options?: Array<{
    name: string,
    description?: string,
    parse?: (val: string) => any,
    default?:
      | string
      | boolean
      | number
      | ((config: ConfigT) => string | boolean | number),
  }>,
  examples?: Array<{
    desc: string,
    cmd: string,
  }>,
};
```

> Note: `ConfigT` is described in [`configuration`](./configuration.md) section

#### `name`

A name that will be used in order to run the command.

Note: If you want your command to accept additional arguments, make sure to include them in the name.

For example, `my-command <argument>` will require an argument to be provided and will throw a validation error otherwise. Alternatively, `my-command [argument]` will accept an argument, but will not throw when run without it. In that case, make sure to check for its presence.

#### `func`

Function that will be run when this command is executed. Receives an array of arguments, in order they were provided, a config object (see [`configuration` section](./configuration.md)) and options, that were passed to your command.

You can return a Promise if your command is async.

All errors are handled by the built-in logger. Prefer throwing instead of implementing your own logging mechanism.

#### `options`

An array of options that your command accepts.

##### `options.name`

Name of the option.

For example, a `--reset-cache` option will result in a `resetCache: true` or `resetCache: false` present in the `options` object - passed to a command function as a last argument.

Just like with a [command name](#name), your option can require a value (e.g. `--port <port>`) or accept an optional one (e.g. `--host [host]`). In this case, you may find [`default`](#optionsdefault) value useful.

> Note: Almost all names are accepted, but **there's an exception** for `--version`, we consider it a reserved word and do not guarantee that it will
work as expected, so avoid using it. (see [this](https://github.com/react-native-community/cli/issues/1300) for further details)

##### `options.description`

Optional description of your option. When provided, will be used to output a better help information.

##### `options.parse`

Parsing function that can be used to transform a raw (string) option as passed by the user into a format expected by your function.

##### `options.default`

Default value for the option when not provided. Can be either a primitive value or a function, that receives a configuration and returns a primitive.

Useful when you want to use project settings as default value for your option.

#### `examples`

An array of example usage of the command to be printed to the user.

##### `examples.desc`

String that describes this particular usage.

##### `examples.cmd`

A command with arguments and options (if applicable) that can be run in order to achieve the desired goal.


## Migrating from `rnpm` configuration

The changes are mostly cosmetic so the migration should be pretty straight-forward.

### Changing the configuration

A `plugin` property should be renamed to `commands`.

For example, the following `rnpm` configuration inside `package.json`:

```json
{
  "rnpm": {
    "plugin": "./path-to-commands.js"
  }
}
```

should be moved to a `react-native.config.js`:

```js
module.exports = {
  commands: require('./path-to-commands.js'),
};
```

provided that `./path-to-commands.js` returns an array of commands.

### Renaming command options

If your command accepts options, rename `command` property of each of them to `name`.

```diff
 module.exports = {
   name: 'foo',
   func: () => console.log('My work'),
   options: [
     {
-      command: '--reset-cache, --resetCache',
+      name: '--reset-cache, --resetCache',
       description: 'Removes cached files',
     }
   ]
 }
```
