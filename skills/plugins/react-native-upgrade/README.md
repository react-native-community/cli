# React Native Upgrade

A skill for upgrading React Native versions in Community CLI projects. Uses diffs from the [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) to apply changes.

## Skills

| Skill | Description |
|-------|-------------|
| [upgrade-react-native](./skills/upgrade-react-native/) | Upgrade react-native to a target version using the upgrade helper diff |

## Installation

### Claude Code

```
/plugin marketplace add react-native-community/react-native-cli skills
/plugin install react-native-upgrade
```

### Cursor

Open **Settings → Rules & Commands → Project Rules → Add Rule → Remote Rule (GitHub)** and enter:

```
https://github.com/react-native-community/react-native-cli.git
```

Cursor will auto-discover skills based on their descriptions.
