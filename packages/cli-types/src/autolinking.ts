export interface CocoaPodDescription {
  name: string;
  relativePath: string;
  configurations: string[];
}

export interface ListModules {
  reactNativePath: string;
  pods: CocoaPodDescription[];
}
