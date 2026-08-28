#!/bin/bash

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

source "$THIS_DIR/.packager.env" || exit 1
cd "$PROJECT_ROOT" || exit 1
"$REACT_NATIVE_PATH/cli.js" start --port "$RCT_METRO_PORT"
CLI_EXIT_CODE=$?

if [[ -z "$CI" ]]; then
  echo "Process terminated. Press <enter> to close the window"
  read -r
fi

exit "$CLI_EXIT_CODE"
