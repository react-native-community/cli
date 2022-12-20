#!/usr/bin/env node

import './tools/gracefulifyFs';
import semver from 'semver';
import chalk from 'chalk';
import {versionRanges} from '@react-native-community/cli-doctor';

if (semver.satisfies(process.version, versionRanges.NODE_JS)) {
  const {run} = require('./');
  run();
} else {
  console.error(`${chalk.red('You need at least Node 14 to run CLI.')}`);
}
