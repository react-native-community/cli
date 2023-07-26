# @react-native-community/cli-hermes

This package is part of the [React Native CLI](../../README.md). It contains commands for managing the Hermes engine.

## Installation

```sh
yarn add @react-native-community/cli-hermes
```

## Commands

### `profile-hermes`

Usage:

```sh
npx react-native profile-hermes [destinationDir] <flag>
```

Pull and convert a Hermes tracing profile to Chrome tracing profile, then store it in the directory <destinationDir> of the local machine.

- `destinationDir` is optional, if provided, pull the file to that directory
  > default: pull to the current React Native app root directory

#### Options

#### `--filename <string>`

File name of the profile to be downloaded, eg. sampling-profiler-trace8593107139682635366.cpuprofile.

> default: pull the latest file

#### `--raw`

Pulls the original Hermes tracing profile without any transformation

#### `--sourcemap-path <string>`

The local path to your source map file if you generated it manually, ex. `/tmp/sourcemap.json`

#### `--generate-sourcemap`

Generate the JS bundle and source map in `os.tmpdir()`

#### `--port <number>`

The running metro server port number

> default: 8081

#### `--appId <string>`

Specify an `applicationId` to launch after build. If not specified, `package` from AndroidManifest.xml will be used.

#### `--appIdSuffix <string>`

Specify an `applicationIdSuffix` to launch after build.

### Notes on source map

This step is recommended in order for the source map to be generated:

If you are planning on building a debug APK, that will run without the packager, by invoking `./gradlew assembleDebug` you can simply set `bundleInDebug: true` in your app/build.gradle file, inside the `project.ext.react` map.
