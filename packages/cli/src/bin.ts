#!/usr/bin/env node

import './tools/gracefulifyFs';
import semver from 'semver';
import chalk from 'chalk';
import {versionRanges} from '@react-native-community/cli-doctor';

if (semver.satisfies(process.version, versionRanges.NODE_JS)) {
  const {run} = require('./');
  run();
} else {
  console.error(
    `${chalk.red(
      `React Native needs Node.js ${versionRanges.NODE_JS}. You're currently on version ${process.version}. Please upgrade Node.js to a supported version and try again.`,
    )}`,
  );
}
