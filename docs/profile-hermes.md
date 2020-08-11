# Visualize JavaScript's performance in a React Native app using Hermes

## How to profile your app using Hermes

- Instructions on how to enable Hermes: [Using Hermes](https://reactnative.dev/docs/hermes)
- How to profile the app:
  - Open Developer Menu with `Cmd+M` or Shake the device. Select `Enable Sampling Profiler`
  - Execute JavaScript by using the app's functions (pressing buttons, etc.)
  - Open Developer Menu again, select `Disable Sampling Profiler`. A toast shows the location where the sampling profiler is saved - usually in `/data/user/0/com.appName/cache/*.cpuprofile`.

## How to pull the sampling profiler to your local machine

### React Native CLI

Usage:

### `react-native profile-hermes [destinationDir]`

Pull and convert a Hermes tracing profile to Chrome tracing profile, then store them in the directory <destinationDir> of the local machine. `destinationDir` is optional, if provided, pull the file to that directory (if not present, pull to the current React Native app root directory)

Options:

#### `--fileName [string]`

File name of the profile to be downloaded, eg. sampling-profiler-trace8593107139682635366.cpuprofile. If not provided, pull the latest file

#### `--verbose`

Listing adb commands that are run internally to pull the file from Android device

#### `--raw`

Pull the original Hermes tracing profile without any transformation

#### `--sourcemap-path [string]`

The local path to where source map file is stored, eg. Users/.../Desktop/sourcemap.json

#### `--generate-sourcemap`

Generate the JS bundle and source map

## Common errors encountered during the process

#### adb: no devices/emulators found

Solution: make sure your Android device/ emulator is connected and running. The command only works when it can access adb

#### There is no file in the cache/ directory

User may have forgotten to record a profile from the device (instruction on how to enable/ disable profiler is above)

## Testing plan

Using `yarn link` as instructed by the CLI's [Testing Plan](https://github.com/MLH-Fellowship/cli/blob/master/CONTRIBUTING.md#testing-your-changes) does not work for us.

### Reason:

Get the error `ReferenceError: SHA-1 for file ... is not computed` even if we run `react-native start --watchFolders /path/to/cloned/cli/`. That's because we use the command `react-native bundle` within our code, which creates a new Metro Server that can't find the symlinked folder

### Solution:
