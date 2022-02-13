import path from 'path';
import {logger} from '@react-native-community/cli-tools';
import ejs from 'ejs';
const BINARIES = /(gradlew|\.(jar|keystore|png|jpg|gif))$/;
// We need `graceful-fs` behavior around async file renames on Win32.
// `gracefulify` does not support patching `fs.promises`. Use `fs-extra`, which
// exposes its own promise-based interface over `graceful-fs`.
import fs from 'fs-extra';

type placeholdersType = {[key: string]: any};

export function overridePlaceholderTitle(
  projectTitle?: string,
  placeholders?: placeholdersType,
) {
  if (projectTitle && placeholders) {
    placeholders.title = projectTitle;
  }
}

export async function copyTemplateAndReplacePlaceholders(
  templateName: string,
  templateDir: string,
  templateSourceDir: string,
  placeholders: placeholdersType = {},
) {
  const templatePath = path.resolve(
    templateSourceDir,
    'node_modules',
    templateName,
    templateDir,
  );

  const dest = process.cwd();

  logger.debug(
    `Copying template from ${templatePath} and replace placeholders`,
  );

  await CopyDirWithReplacePlaceholders(templatePath, dest, placeholders);
}

export const CopyDirWithReplacePlaceholders = async (
  source: string,
  dest: string,
  placeholders: placeholdersType = {},
) => {
  await fs.mkdirp(dest);

  const files = await fs.readdir(source);
  for (const f of files) {
    const target = path.join(
      dest,
      ejs.render(f.replace(/^\$/, ''), placeholders, {
        openDelimiter: '{',
        closeDelimiter: '}',
      }),
    );

    const file = path.join(source, f);
    const stats = await fs.stat(file);

    if (stats.isDirectory()) {
      await CopyDirWithReplacePlaceholders(file, target, placeholders);
    } else if (!file.match(BINARIES)) {
      const content = await fs.readFile(file, 'utf8');
      await fs.writeFile(target, ejs.render(content, placeholders));
    } else {
      await fs.copyFile(file, target);
    }
  }
};
