import {getProjectConfig} from '@react-native-community/cli-platform-apple';

export {dependencyConfig} from '@react-native-community/cli-platform-apple';
export const projectConfig = getProjectConfig({platformName: 'ios'});
