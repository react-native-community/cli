declare module '@react-native/metro-config' {
  import type {ConfigT} from 'metro-config';

  export function getDefaultConfig(projectRoot: string): ConfigT;
}
