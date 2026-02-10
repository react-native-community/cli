# Upgrade Helper API Reference

The [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
uses pre-computed diffs from
[react-native-community/rn-diff-purge](https://github.com/react-native-community/rn-diff-purge).

## Endpoints

All endpoints are plain HTTP GET requests with no authentication required.

### List available versions

```
GET https://raw.githubusercontent.com/react-native-community/rn-diff-purge/master/RELEASES
```

Returns a plain-text file with one version per line.

### Fetch a diff between two versions

```
GET https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/{fromVersion}..{toVersion}.diff
```

Returns a standard unified diff (same format as `git diff` output).

**Example:**

```
https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/0.73.0..0.74.0.diff
```

### View a file at a specific version

```
GET https://raw.githubusercontent.com/react-native-community/rn-diff-purge/release/{version}/RnDiffApp/{path}
```

### GitHub compare view

```
https://github.com/react-native-community/rn-diff-purge/compare/release/{fromVersion}..release/{toVersion}
```

### Web UI with pre-filled versions

```
https://react-native-community.github.io/upgrade-helper/?from={fromVersion}&to={toVersion}
```

## Diff format notes

- All file paths are prefixed with `RnDiffApp/` (the template project name).
- The default app name is `RnDiffApp` with Android package `com.rndiffapp`.
- When applying diffs, replace these template names with the actual project's
  app name and package identifiers.
- Binary files (e.g. Gradle wrapper JAR) appear as binary patch deltas and
  should be downloaded directly from the target version's branch instead of
  applying the diff.

## Platform variants

| Platform | Repository | Diff URL pattern |
|----------|-----------|-----------------|
| React Native (iOS/Android) | `react-native-community/rn-diff-purge` | `diffs/{from}..{to}.diff` |
| React Native macOS | `acoates-ms/rnw-diff` | `diffs/mac/{from}..{to}.diff` |
| React Native Windows (C++) | `acoates-ms/rnw-diff` | `diffs/cpp/{from}..{to}.diff` |
| React Native Windows (C#) | `acoates-ms/rnw-diff` | `diffs/cs/{from}..{to}.diff` |
