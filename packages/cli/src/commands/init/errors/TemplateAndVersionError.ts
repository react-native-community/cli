export default class TemplateAndVersionError extends Error {
  constructor(template: string) {
    super(
      `Passing both "version" and "template" is not supported. The template you select determines the version of react-native used. Please use only one of these options, for example:
      
      --template ${template}@x.y.z
      
      where x.y.z is the release of the template that contains the desired "react-native" version. Check the version tab of https://www.npmjs.com/package/${template} for available versions`,
    );
  }
}
