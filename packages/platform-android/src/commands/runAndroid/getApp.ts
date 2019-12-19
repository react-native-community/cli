import xmlParser from 'fast-xml-parser';
import fs from 'fs';
// @ts-ignore
import g2js from 'gradle-to-js/lib/parser';
import flatten from 'flat';

const MAIN_ACTION = 'android.intent.action.MAIN';
const LAUNCHER = 'android.intent.category.LAUNCHER';

interface Activity {
  [x: string]: any;
}

interface Variants {
  [k: string]: string;
}

export interface App {
  packageName: string;
  mainActivity: string;
  name: string;
  variants: Variants;
}

// runtime cache
let app: App = {
  packageName: '',
  mainActivity: '',
  name: '',
  variants: {},
};

export async function getApp(appFolder: string): Promise<App> {
  if (app.packageName) {
    return app;
  }
  const manifestPath = `${appFolder}/src/main/AndroidManifest.xml`;
  const appGradlePath = `${appFolder}/build.gradle`;
  const manifestContent = fs.readFileSync(manifestPath, {encoding: 'utf8'});
  if (xmlParser.validate(manifestContent)) {
    const {manifest} = xmlParser.parse(manifestContent, {
      attributeNamePrefix: '',
      ignoreAttributes: false,
      ignoreNameSpace: true,
    });

    const {package: packageName, application = {}} = manifest;
    const {activity: activities = [], name} = application;

    const mainActivity = activities.find((activity: Activity) => {
      const intentFilter = activity['intent-filter'];
      if (intentFilter) {
        const {action, category} = intentFilter;
        if (action && category) {
          return action.name === MAIN_ACTION && category.name === LAUNCHER;
        }
      }
      return false;
    });
    let variants: Variants = {};
    try {
      const appBuildConfig = flatten(
        await g2js.parseFile(appGradlePath),
      ) as any;
      Object.keys(appBuildConfig).forEach(key => {
        if (key.endsWith('applicationId')) {
          // get defaultConfig and flavor
          // key: android.defaultConfig.applicationId | android.productFlavor.flavor.applicationId
          const variant = key.split('.').slice(-2)[0] as string;
          variants[variant] = appBuildConfig[key];
        }
      });
    } catch (error) {}
    return {
      packageName,
      name,
      mainActivity: mainActivity ? mainActivity.name : '',
      variants,
    };
  } else {
    throw TypeError('Invalid Manifest');
  }
}
