import {fetchToTemp} from '@react-native-community/cli-tools';

import * as ora from 'ora';
import {unzip} from './unzip';
import {deleteFile} from './deleteFile';

/**
 * Downloads `downloadUrl` and unzips the contents to `installPath` while
 * updating the message of `loader` at each step.
 */
export const downloadAndUnzip = async ({
  loader,
  downloadUrl,
  component,
  installPath,
}: {
  loader: ora.Ora;
  component: string;
  downloadUrl: string;
  installPath: string;
}) => {
  loader.start(
    `Downloading ${component} from "${downloadUrl}" (this may take a few minutes)`,
  );

  const installer = await fetchToTemp(downloadUrl);

  loader.text = `Installing ${component} in "${installPath}"`;
  try {
    await unzip(installer, installPath);
  } finally {
    await deleteFile(installer);
  }
};
