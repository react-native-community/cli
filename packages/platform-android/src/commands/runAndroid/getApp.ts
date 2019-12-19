// @ts-ignore
import g2js from 'gradle-to-js/lib/parser';
import flatten from 'flat';
import readManifest, {Manifest} from '../../config/readManifest';

interface VariantMap {
  [k: string]: string;
}

interface App extends Manifest {
  packageName: string;
  mainActivity: string;
  name: string;
  variants: VariantMap;
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
  const manifest = readManifest(manifestPath);
  let variants: VariantMap = {};
  try {
    const appBuildConfig = flatten(await g2js.parseFile(appGradlePath)) as any;
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
    ...manifest,
    variants,
  };
}
