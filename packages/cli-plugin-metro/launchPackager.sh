THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
source "$THIS_DIR/.packager.env"
cd $PROJECT_ROOT
npx react-native start