// @flow
import path from 'path';
import {URL} from 'url';

const FILE_PROTOCOL = /file:/;

function handleFileProtocol(filePath: string) {
  const uri = new URL(filePath).pathname;

  return {
    uri,
    name: require(path.join(uri, 'package.json')).name,
  };
}

export function processTemplateName(templateName: string) {
  if (templateName.match(FILE_PROTOCOL)) {
    return handleFileProtocol(templateName);
  }

  return {
    uri: templateName,
    name: templateName,
  };
}
