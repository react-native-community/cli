import fs from 'fs';
import {XMLParser, XMLValidator} from 'fast-xml-parser';

const MAIN_ACTION = 'android.intent.action.MAIN';
const LAUNCHER = 'android.intent.category.LAUNCHER';

interface Activity {
  [x: string]: any;
}

interface AndroidNameProperty {
  '@_android:name': string;
}

interface IntentFilter {
  action: AndroidNameProperty | AndroidNameProperty[];
  category: AndroidNameProperty | AndroidNameProperty[];
}

/**
 * Reads the AndroidManifest.xml file and returns the name of the main activity.
 */

export default function getMainActivity(manifestPath: string): string | null {
  try {
    const xmlParser = new XMLParser({ignoreAttributes: false});
    const manifestContent = fs.readFileSync(manifestPath, {encoding: 'utf8'});

    if (XMLValidator.validate(manifestContent)) {
      const {manifest} = xmlParser.parse(manifestContent);

      const application = manifest.application || {};
      const activity = application.activity || {};

      let activities: Activity[] = [];

      if (!Array.isArray(activity)) {
        activities = [activity];
      } else {
        activities = activity;
      }

      const mainActivity = activities.find((act: Activity) => {
        let intentFilters = act['intent-filter'];

        if (!intentFilters) {
          return false;
        }

        if (!Array.isArray(intentFilters)) {
          intentFilters = [intentFilters];
        }

        return intentFilters.find((intentFilter: IntentFilter) => {
          const {action, category} = intentFilter;

          let actions;
          let categories;

          if (!Array.isArray(action)) {
            actions = [action];
          } else {
            actions = action;
          }

          if (!Array.isArray(category)) {
            categories = [category];
          } else {
            categories = category;
          }

          if (actions && categories) {
            const parsedActions: string[] = actions.map(
              ({'@_android:name': name}) => name,
            );

            const parsedCategories: string[] = categories.map(
              ({'@_android:name': name}) => name,
            );

            return (
              parsedActions.includes(MAIN_ACTION) &&
              parsedCategories.includes(LAUNCHER)
            );
          }

          return false;
        });
      });

      return mainActivity ? mainActivity['@_android:name'] : null;
    } else {
      return null;
    }
  } catch {
    return null;
  }
}
