export default class TemplateAndVersionError extends Error {
  constructor(template: string) {
    super(
      `Passing both "version" and "template" is not supported. Templates are in control of "react-native" version. Please choose only one of these, like so:
      
      --template ${template}@x.y.z
      
      where x.y.z is the version containing the "react-native" you'd like. Check: https://www.npmjs.com/package/${template} for available versions`,
    );
  }
}
