import nodeJS from './nodeJS';
import {yarn, npm} from './packageManagers';
import watchman from './watchman';
import xcode from './xcode';
import cocoaPods from './cocoaPods';
import iosDeploy from './iosDeploy';

const issues = {
  common: {
    label: 'Common',
    issues: [nodeJS, yarn, npm, watchman],
  },
  ios: {
    label: 'iOS',
    issues: [xcode, cocoaPods, iosDeploy],
  },
};

export default issues;
