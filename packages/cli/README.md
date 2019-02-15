# run-ios

## Options

### `--simulator={{simulator_name}}`

Use a custom iOS simulator.

Notes: `simulator_name` must be a valid iOS simulator name. If in doubt, open
your AwesomeApp/ios/AwesomeApp.xcodeproj folder on XCode and unroll the dropdown
menu containing the simulator list. The dropdown menu is situated on the right
hand side of the play button (top left corner).

Example: this will launch your projet directly onto the iPhone XS Max simulator:

```sh
react-native run-ios --template='iPhone XS Max'
```
