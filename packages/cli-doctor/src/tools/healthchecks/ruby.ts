import execa from 'execa';
import chalk from 'chalk';

import {logger, findProjectRoot, link} from '@react-native-community/cli-tools';

import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {HealthCheckInterface} from '../../types';
import {inline} from './common';

// Exposed for testing only
export const output = {
  OK: 'Ok',
  NO_GEMFILE: 'No Gemfile',
  NO_RUBY: 'No Ruby',
  BUNDLE_INVALID_RUBY: 'Bundle invalid Ruby',
  UNKNOWN: 'Unknown',
} as const;

// The Change:
// -----------
//
// React Native 0.72 primarily defines the compatible version of Ruby in the
// project's Gemfile [1]. It does this because it allows for ranges instead of
// pinning to a version of Ruby.
//
// In previous versions the .ruby-version file defined the compatible version,
// and it was derived in the Gemfile [2]:
//
// > ruby File.read(File.join(__dir__, '.ruby-version')).strip
//
// Why all of the changes with Ruby?
// ---------------------------------
//
// React Native has had to weigh up a couple of concerns:
//
// - Cocoapods: we don't control the minimum supported version, although that
//   was defined almost a decade ago [3]. Practically system Ruby on macOS works
//   for our users.
//
// - Apple may drop support for scripting language runtimes in future version of
//   macOS [4]. Ruby 2.7 is effectively EOL, which means many supporting tools and
//   developer environments _may_ not support it going forward, and 3.0 is becoming
//   the default in, for example, places like our CI. Some users may be unable to
//   install Ruby 2.7 on their devices as a matter of policy.
//
// - Our Codegen is extensively built in Ruby 2.7.
//
// - A common pain-point for users (old and new) setting up their environment is
//   configuring a Ruby version manager or managing multiple Ruby versions on their
//   device. This occurs so frequently that we've removed the step from our docs [6]
//
// After users suggested bumping Ruby to 3.1.3 [5], a discussion concluded that
// allowing a range of version of Ruby (>= 2.6.10) was the best way forward. This
// balanced the need to make the platform easier to start with, but unblocked more
// sophisticated users.
//
// [1] https://github.com/facebook/react-native/pull/36281
// [2] https://github.com/facebook/react-native/blob/v0.71.3/Gemfile#L4
// [3] https://github.com/CocoaPods/guides.cocoapods.org/commit/30881800ac2bd431d9c5d7ee74404b13e7f43888
// [4] https://developer.apple.com/documentation/macos-release-notes/macos-catalina-10_15-release-notes#Scripting-Language-Runtimes
// [5] https://github.com/facebook/react-native/pull/36074
// [6] https://github.com/facebook/react-native-website/commit/8db97602347a8623f21e3e516245d04bdf6f1a29

async function checkRubyGemfileRequirement(
  projectRoot: string,
): Promise<[string, string?]> {
  const evaluateGemfile = inline`
  require "Bundler"
  gemfile = Bundler::Definition.build("Gemfile", nil, {})
  version = gemfile.ruby_version.engine_versions.join(", ")
  begin
    gemfile.validate_runtime!
  rescue Bundler::GemfileNotFound
    puts "${output.NO_GEMFILE}"
    exit 1
  rescue Bundler::RubyVersionMismatch
    puts "${output.BUNDLE_INVALID_RUBY}"
    STDERR.puts version
    exit 2
  rescue => e
    STDERR e.message
    exit 3
  else
    puts "${output.OK}"
    STDERR.puts version
  end`;

  try {
    await execa('ruby', ['-e', evaluateGemfile], {
      cwd: projectRoot,
    });
    return [output.OK];
  } catch (e) {
    switch ((e as any).code) {
      case 'ENOENT':
        return [output.NO_RUBY];
      case 1:
        return [output.NO_GEMFILE];
      case 2:
        return [output.BUNDLE_INVALID_RUBY, (e as any).stderr];
      default:
        return [output.UNKNOWN, (e as any).message];
    }
  }
}

export default {
  label: 'Ruby',
  isRequired: false,
  description: 'Required for installing iOS dependencies',
  getDiagnostics: async ({Languages}) => {
    let projectRoot;
    try {
      projectRoot = findProjectRoot();
    } catch (e) {
      logger.debug((e as any).message);
    }

    const fallbackResult = {
      needsToBeFixed: doesSoftwareNeedToBeFixed({
        version: Languages.Ruby.version,
        versionRange: versionRanges.RUBY,
      }),
      version: Languages.Ruby.version,
      versionRange: versionRanges.RUBY,
      description: '',
    };

    // No guidance from the project, so we make the best guess
    if (!projectRoot) {
      return fallbackResult;
    }

    // Gemfile
    let [code, versionOrError] = await checkRubyGemfileRequirement(projectRoot);
    switch (code) {
      case output.OK: {
        return {
          needsToBeFixed: false,
          version: Languages.Ruby.version,
          versionRange: versionOrError,
        };
      }
      case output.BUNDLE_INVALID_RUBY:
        return {
          needsToBeFixed: true,
          version: Languages.Ruby.version,
          versionRange: versionOrError,
        };
      case output.NO_RUBY:
        return {
          needsToBeFixed: true,
          description: 'Cannot find a working copy of Ruby.',
        };
      case output.NO_GEMFILE:
        fallbackResult.description = `Could not find the project ${chalk.bold(
          'Gemfile',
        )} in your project folder (${chalk.dim(
          projectRoot,
        )}), guessed using my built-in version.`;
        break;
      default:
        if (versionOrError) {
          logger.warn(versionOrError);
        }
        break;
    }

    return fallbackResult;
  },
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.fail();

    logManualInstallation({
      healthcheck: 'Ruby',
      url: link.docs('environment-setup', 'ios', {
        hash: 'ruby',
        guide: 'native',
      }),
    });
  },
} as HealthCheckInterface;
