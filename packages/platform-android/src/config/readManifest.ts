/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import xmlParser from 'fast-xml-parser';

const MAIN_ACTION = 'android.intent.action.MAIN';
const LAUNCHER = 'android.intent.category.LAUNCHER';

interface Activity {
  [x: string]: any;
}

export interface Manifest {
  packageName: string;
  mainActivity: string;
  name: string;
}

export default function readManifest(manifestPath: string): Manifest {
  const manifestContent = fs.readFileSync(manifestPath, {encoding: 'utf8'});
  // generally, validate will always return `true`
  if (xmlParser.validate(manifestContent)) {
    const {manifest} = xmlParser.parse(manifestContent, {
      attributeNamePrefix: '',
      ignoreAttributes: false,
      ignoreNameSpace: true,
    });

    const {package: packageName, application = {}} = manifest;
    const {activity = [], name} = application;

    let activities: Activity[] = [];

    if (!Array.isArray(activity)) {
      activities = [activity];
    } else {
      activities = activity;
    }

    const mainActivity = activities.find((act: Activity) => {
      const intentFilter = act['intent-filter'];
      if (intentFilter) {
        const {action, category} = intentFilter;
        if (action && category) {
          return action.name === MAIN_ACTION && category.name === LAUNCHER;
        }
      }
      return false;
    });
    return {
      packageName,
      name,
      mainActivity: mainActivity ? mainActivity.name : '',
    };
  } else {
    // no error throw, but return empty string
    return {
      packageName: '',
      mainActivity: '',
      name: '',
    };
  }
}
