# @react-native-community/skills

Official AI coding agent skills for React Native Community CLI projects. Installable in [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [Cursor](https://cursor.sh).

## Available skills

| Skill | Description |
|-------|-------------|
| [upgrade-react-native](./upgrade-react-native/) | Upgrade React Native versions using the upgrade helper diff |

## Installation

### Claude Code

```sh
npx skills add react-native-community/skills
```

### Cursor

Open **Settings → Rules & Commands → Project Rules → Add Rule → Remote Rule (GitHub)** and enter:

```
https://github.com/react-native-community/react-native-cli.git
```

Skills are auto-discovered by Cursor based on their descriptions.

### Other agents

```sh
npx skills add react-native-community/skills
```
