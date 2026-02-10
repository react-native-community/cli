# @react-native-community/skills

Official AI coding agent skills for React Native Community CLI projects. Installable in [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [Cursor](https://cursor.sh).

## Available plugins

| Plugin | Description |
|--------|-------------|
| [react-native-upgrade](./plugins/react-native-upgrade/) | Upgrade React Native versions using the upgrade helper diff |

## Installation

### Claude Code

```sh
# Add the marketplace
/plugin marketplace add react-native-community/react-native-cli skills

# Install a plugin
/plugin install react-native-upgrade
```

### Cursor

Open **Settings → Rules & Commands → Project Rules → Add Rule → Remote Rule (GitHub)** and enter:

```
https://github.com/react-native-community/react-native-cli.git
```

Skills are auto-discovered by Cursor based on their descriptions.

### Other agents

```sh
npx skills add react-native-community/react-native-cli skills
```
