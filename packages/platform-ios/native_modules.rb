# This is a function which is used inside your Podfile.
#
# It uses `react-native config` to grab a list of dependencies, and pulls out
# all of the ones which declare themselves to be iOS/macOS dependencies (by
# virtue of having a Podspec) and automatically imports those into your current
# target.
#
# See the `IOSNativeModulesConfig` interface in `cli-types/src/ios.ts` to
# understand what the input data should look like. Be sure to update that file
# in lock-step with additional data being used here.

require 'pathname'
require 'cocoapods'

def use_native_modules!(config = nil)
  if (config.is_a? String)
    Pod::UI.warn("Passing custom root to use_native_modules! is deprecated.",
      [
        "CLI detects root of the project automatically. The \"#{config}\" argument was ignored.",
      ]);
    config = nil;
  end

  # Resolving the path the RN CLI. The `@react-native-community/cli` module may not be there for certain package managers, so we fall back to resolving it through `react-native` package, that's always present in RN projects
  cli_resolve_script = "try {console.log(require('@react-native-community/cli').bin);} catch (e) {console.log(require('react-native/cli').bin);}"
  cli_bin = Pod::Executable.execute_command("node", ["-e", cli_resolve_script], true).strip

  if (!config)
    json = []

    IO.popen(["node", cli_bin, "config"]) do |data|
      while line = data.gets
        json << line
      end
    end

    config = JSON.parse(json.join("\n"))
  end

  project_root = Pathname.new(config["project"]["ios"]["sourceDir"])

  packages = config["dependencies"]
  found_pods = []

  packages.each do |package_name, package|
    next unless package_config = package["platforms"]["ios"]

    podspec_path = package_config["podspecPath"]

    # Add a warning to the queue and continue to the next dependency if the podspec_path is nil/empty
    if podspec_path.nil? || podspec_path.empty?
      Pod::UI.warn("use_native_modules! skipped the react-native dependency '#{package["name"]}'. No podspec file was found.",
        [
          "Check to see if there is an updated version that contains the necessary podspec file",
          "Contact the library maintainers or send them a PR to add a podspec. The react-native-webview podspec is a good example of a package.json driven podspec. See https://github.com/react-native-community/react-native-webview/blob/master/react-native-webview.podspec",
          "If necessary, you can disable autolinking for the dependency and link it manually. See https://github.com/react-native-community/cli/blob/master/docs/autolinking.md#how-can-i-disable-autolinking-for-unsupported-library"
        ])
    end
    next if podspec_path.nil? || podspec_path.empty?

    spec = Pod::Specification.from_file(podspec_path)

    # We want to do a look up inside the current CocoaPods target
    # to see if it's already included, this:
    #   1. Gives you the chance to define it beforehand
    #   2. Ensures CocoaPods won't explode if it's included twice
    #
    this_target = current_target_definition
    existing_deps = current_target_definition.dependencies

    # Skip dependencies that the user already activated themselves.
    next if existing_deps.find do |existing_dep|
      existing_dep.name.split('/').first == spec.name
    end

    podspec_dir_path = Pathname.new(File.dirname(podspec_path))

    relative_path = podspec_dir_path.relative_path_from project_root

    pod spec.name, :path => relative_path.to_path

    if package_config["scriptPhases"] && !this_target.abstract?
      # Can be either an object, or an array of objects
      Array(package_config["scriptPhases"]).each do |phase|
        # see https://www.rubydoc.info/gems/cocoapods-core/Pod/Podfile/DSL#script_phase-instance_method
        # for the full object keys
        Pod::UI.puts "Adding a custom script phase for Pod #{spec.name}: #{phase["name"] || 'No name specified.'}"

        # Support passing in a path relative to the root of the package
        if phase["path"]
          phase["script"] = File.read(File.expand_path(phase["path"], package["root"]))
          phase.delete("path")
        end

        # Support converting the execution position into a symbol
        if phase["execution_position"]
          phase["execution_position"] = phase["execution_position"].to_sym
        end

        phase = Hash[phase.map { |k, v| [k.to_sym, v] }]
        script_phase phase
      end
    end

    found_pods.push spec
  end

  if found_pods.size > 0
    pods = found_pods.map { |p| p.name }.sort.to_sentence
    Pod::UI.puts "Detected React Native module #{"pod".pluralize(found_pods.size)} for #{pods}"
  end
  
  config
end

# You can run the tests for this file by running:
# $ yarn jest packages/platform-ios/src/config/__tests__/native_modules.test.ts
if $0 == __FILE__
  require "json"
  targets = JSON.parse(ARGF.read)

  unless targets["capture_stdout"]
    Pod::Config.instance.silent = true
  end

  podfile = Pod::Podfile.new do
    if targets["pods_activated_by_user"]
      targets["pods_activated_by_user"].each do |name|
        pod(name)
      end
    end
    targets.each do |name, config|
      next if ["capture_stdout", "pods_activated_by_user"].include?(name)
      target(name) do
        platform(name.to_sym)
        use_native_modules!(config)
      end
    end
  end

  unless targets["capture_stdout"]
    puts podfile.to_hash.to_json
  end
end
