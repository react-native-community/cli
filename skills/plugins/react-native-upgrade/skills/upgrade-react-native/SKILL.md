---
name: upgrade-react-native
description: >
  Use when upgrading react-native to a newer version. Handles version bumps,
  native project changes (Android/iOS), dependency updates, and breaking change
  migration. Invoke with `/upgrade-react-native <version>`.
version: 0.1.0
license: MIT
---

# Upgrade React Native

Upgrade a React Native Community CLI project to a target version by fetching
and applying the diff from the
[React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/).

## Invocation

```
/upgrade-react-native <targetVersion>
```

- `<targetVersion>` — the React Native version to upgrade to (e.g. `0.79.0`).

## Step-by-step procedure

Follow every step below **in order**. Do not skip steps.

### 1. Detect the current React Native version

Read the project's root `package.json` and extract the `react-native` version
from `dependencies` (or `devDependencies`). Strip any semver range prefix
(`^`, `~`, `>=`, etc.) to get the exact current version string.

If the current version cannot be determined, stop and ask the user.

### 2. Validate the target version

- The target version must be a valid semver string (e.g. `0.79.0`).
- It must be **greater than** the current version.
- Verify the target version exists by checking:
  ```
  https://raw.githubusercontent.com/react-native-community/rn-diff-purge/master/RELEASES
  ```
  Fetch this file and confirm the target version is listed. If not, report the
  closest available versions and ask the user to choose.

### 3. Fetch the upgrade diff

Fetch the unified diff between the two versions:

```
https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/<currentVersion>..<targetVersion>.diff
```

For example, to upgrade from `0.73.0` to `0.74.0`:

```
https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/0.73.0..0.74.0.diff
```

If the diff cannot be fetched (404), it may be because exact patch versions are
not available. Try the nearest minor versions (e.g. `0.73.0` instead of
`0.73.2`). Report what you tried and ask the user if needed.

### 4. Parse the diff and map file paths

The diff uses the template project name `RnDiffApp`. Map every path in the diff
to the actual project:

| Diff path prefix | Actual project path |
|------------------|---------------------|
| `RnDiffApp/` | Project root (`./`) |

Additionally, replace occurrences of the template identifiers with the project's
actual names:

| Template value | Replace with |
|----------------|--------------|
| `RnDiffApp` | The project's app name (from `app.json` → `name`, or the `name` field in `package.json`) |
| `rndiffapp` | Lowercase version of the project's app name |
| `com.rndiffapp` | The project's Android package name (from `android/app/build.gradle` or `android/app/src/main/AndroidManifest.xml`) |

### 5. Review the diff and plan changes

Before making any edits, review the entire diff and categorize changes:

1. **Direct applies** — files that exist in the project and whose original
   content matches the diff's `-` lines. These can be applied as-is.
2. **Conflicts** — files where the project's content has diverged from the
   template (custom modifications). These need manual merging.
3. **New files** — files in the diff that don't exist in the project yet. Create
   them.
4. **Deleted files** — files the diff removes. Delete them only if the project
   hasn't added custom content to them.

Present this plan to the user before proceeding. Group changes by area:

- **Root config files** (`package.json`, `metro.config.js`, `.eslintrc.js`, etc.)
- **iOS native files** (`ios/` directory)
- **Android native files** (`android/` directory)
- **JavaScript/TypeScript source** (if any template source files changed)
- **Third-party native dependencies** (from step 7 — include any version bumps
  identified there)

### 6. Apply changes

Apply the changes following the plan from step 5:

- For **direct applies**: edit the file to match the diff's `+` lines.
- For **conflicts**: apply the upgrade changes while preserving the project's
  customizations. Use your judgement to merge. If uncertain, show both versions
  and ask the user.
- For **new files**: create them at the mapped path.
- For **deleted files**: remove them.

**Important considerations:**

- When updating `package.json`, update the `react-native` version and any
  related dependencies mentioned in the diff (e.g. `react`, `@react-native/*`
  packages, Gradle versions, CocoaPods versions).
- Do NOT run `npm install` / `yarn install` / `pod install` automatically.
  Inform the user these steps are needed after the upgrade.
- Refer to the [references](#references) section for version-specific guidance
  on breaking changes and migration notes.

### 7. Update third-party native dependencies

Scan the project's `dependencies` and `devDependencies` in `package.json` for
third-party React Native libraries that contain **native code** (i.e. they have
an `ios/` or `android/` directory, or are known native modules). Common examples
include `react-native-screens`, `react-native-reanimated`,
`react-native-gesture-handler`, `@react-native-async-storage/async-storage`,
`react-native-svg`, `react-native-safe-area-context`, etc.

For each candidate dependency:

1. **Fetch the library's README** from its GitHub repository or npm page.
2. **Look for a React Native version compatibility table or section** — many
   native libraries document which versions of their package support which React
   Native versions (e.g. a "Compatibility" or "Version Support" table).
3. **If the README contains a compatibility table** that maps the target React
   Native version to a specific library version, include that library version
   bump in the upgrade plan.
4. **If the README does not mention version compatibility with React Native
   versions**, skip the library — do not guess or assume an upgrade is needed.

Present all proposed dependency bumps alongside the diff-based changes in step 5
(grouped under a **Third-party native dependencies** section). For each:

- State the current version, the proposed version, and link to the compatibility
  info you found.
- If multiple major versions are compatible, prefer the latest stable version
  that supports the target React Native version.

Apply these version bumps to `package.json` as part of step 6.

### 8. Post-upgrade checklist

After applying all changes, present the user with a checklist:

- [ ] Run `npm install` or `yarn install` to update JS dependencies
- [ ] Run `cd ios && bundle exec pod install` (or `npx pod-install`) to update
      native iOS dependencies
- [ ] Run a clean build for Android: `cd android && ./gradlew clean`
- [ ] Run a clean build for iOS: `cd ios && xcodebuild clean`
- [ ] Run the app on both platforms to verify it launches
- [ ] Run the project's test suite
- [ ] Review any conflict resolutions for correctness
- [ ] Check the [React Native changelog](https://github.com/facebook/react-native/blob/main/CHANGELOG.md) for additional breaking changes
- [ ] Check the [Upgrade Helper web UI](https://react-native-community.github.io/upgrade-helper/?from=<currentVersion>&to=<targetVersion>) for any supplementary notes

## References

Consult these for version-specific migration guidance:

- [references/upgrade-helper-api.md](./references/upgrade-helper-api.md) — How
  to fetch diffs and version lists programmatically
