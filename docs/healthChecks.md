# Health Check Plugins

Plugins can be used to extend the health checks that `react-native doctor` runs.  This can be used to add additional checks for out of tree platforms, or other checks that are specific to a community module.

See [`Plugins`](./plugins.md) for information about how plugins work.  


## How does it work?

To provide additional health checks, a package needs to have a `react-native.config.js` at the root folder in order to be discovered by the CLI as a plugin.

```js
module.exports = {
  healthChecks: [
    {
      label: 'Foo',
      healthchecks: [
        label: 'bar-installed',
          getDiagnostics: async () => ({
            needsToBeFixed: !isBarInstalled()
          }),
          runAutomaticFix: async ({loader}) => {
            await installBar();
            loader.succeed();
          },
        }
      ],
};
```

> Above is an example of a plugin that extends the healthChecks performed by `react-native doctor` to check if `bar` is installed.

At the startup, React Native CLI reads configuration from all dependencies listed in `package.json` and reduces them into a single configuration.

At the end, an array of health check categories is concatenated to be checked when `react-native doctor` is run.


## HealthCheckCategory interface

```ts
type HealthCheckCategory = {
  label: string;
  healthchecks: HealthCheckInterface[];
};
```

##### `label`

Name of the category for this health check. This will be used to group health checks in doctor.

##### `healthChecks`

Array of health checks to perorm in this category


## HealthCheckInterface interface

```ts
type HealthCheckInterface = {
  label: string;
  visible?: boolean | void;
  isRequired?: boolean;
  description?: string;
  getDiagnostics: (
    environmentInfo: EnvironmentInfo,
  ) => Promise<{
    version?: string;
    versions?: [string];
    versionRange?: string;
    needsToBeFixed: boolean | string;
  }>;
  win32AutomaticFix?: RunAutomaticFix;
  darwinAutomaticFix?: RunAutomaticFix;
  linuxAutomaticFix?: RunAutomaticFix;
  runAutomaticFix: RunAutomaticFix;
};
```

##### `label`

Name of this health check

##### `visible`

If set to false, doctor will ignore this health check

##### `isRequired`

Is this health check required or optional?

##### `description`

Longer description of this health check


##### `getDiagnostics`

Functions which performs the actual check.  Simple checks can just return `needsToBeFixed`.  Checks which are looking at versions of an installed component (such as the version of node), can also return `version`, `versions` and `versionRange` to provide better information to be displayed in `react-native doctor` when running the check

##### `win32AutomaticFix`

This function will be used to try to fix the issue when `react-native doctor` is run on a windows machine. If this is not specified, `runAutomaticFix` will be run instead.

##### `darwinAutomaticFix`

This function will be used to try to fix the issue when `react-native doctor` is run on a macOS machine. If this is not specified, `runAutomaticFix` will be run instead.

##### `linuxAutomaticFix`

This function will be used to try to fix the issue when `react-native doctor` is run on a linux machine. If this is not specified, `runAutomaticFix` will be run instead.

##### `runAutomaticFix`

This function will be used to try to fix the issue when `react-native doctor` is run and no more platform specific automatic fix function was provided.


## RunAutomaticFix interface

```ts
type RunAutomaticFix = (args: {
  loader: Ora;
  logManualInstallation: ({
    healthcheck,
    url,
    command,
    message,
  }: {
    healthcheck?: string;
    url?: string;
    command?: string;
    message?: string;
  }) => void;
  environmentInfo: EnvironmentInfo;
}) => Promise<void> | void;
```

##### `loader`

A reference to a [`ora`](https://www.npmjs.com/package/ora) instance which should be used to report success / failure, and progress of the fix.  The fix function should always call either `loader.succeed()` or `loader.fail()` before returning.

##### `logManualInstallation`

If an automated fix cannot be performed, this function should be used to provide instructions to the user on how to manually fix the issue.

##### `environmentInfo`

Provides information about the current system


### Examples of RunAutomaticFix implementations

A health check that requires the user to manually go download/install something.  This check will immediately display a message to notify the user how to fix the issue.

```ts
async function needToInstallFoo({loader, logManualInstallation}) {
    loader.fail();

    return logManualInstallation({
      healthcheck: 'Foo',
      url: 'https:/foo.com/download',
    });
}
```

A health check that runs some commands locally which may fix the issue.  This check will display a spinner while the exec commands are running.  Then once the commands are complete, the spinner will change to a checkmark.

```ts

import { exec } from 'promisify-child-process';
async function fixFoo({loader}) {
  await exec(`foo --install`);
  await exec(`foo --fix`);

  loader.succeed();
}
