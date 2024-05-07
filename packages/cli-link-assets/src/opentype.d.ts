// Extracted from @types/opentype.js@1.3.8
// Do not use @types/opentype.js as it references lib-dom

declare module 'opentype.js' {
  export interface LocalizedName {
    [lang: string]: string;
  }
  export interface Field {
    name: string;
    type: string;
    value: any;
  }
  export interface Table {
    [propName: string]: any;
    encode(): number[];
    fields: Field[];
    sizeOf(): number;
    tables: Table[];
    tableName: string;
  }
  export class Font {
    tables: {[tableName: string]: Table};
  }
  export function parse(buffer: any): Font;
}
