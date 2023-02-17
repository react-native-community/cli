export const gradleTaskOutput = `
> Task :tasks

------------------------------------------------------------
Tasks runnable from root project 'com.bananas'
------------------------------------------------------------

Android tasks
-------------
androidDependencies - Displays the Android dependencies of the project.
signingReport - Displays the signing info for the base and test modules
sourceSets - Prints out all the source sets defined in this project.

Build tasks
-----------
assemble - Assemble main outputs for all the variants.
assembleAndroidTest - Assembles all the Test applications.
assembleDebug - Assembles main outputs for all Debug variants.
assembleProduction - Assembles main outputs for all Production variants.
assembleRelease - Assembles main outputs for all Release variants.
assembleUat - Assembles main outputs for all Uat variants.
build - Assembles and tests this project.
buildDependents - Assembles and tests this project and all projects that depend on it.
buildNeeded - Assembles and tests this project and all projects it depends on.
bundle - Assemble bundles for all the variants.
bundleDebug - Assembles bundles for all Debug variants.
bundleProduction - Assembles bundles for all Production variants.
bundleRelease - Assembles bundles for all Release variants.
bundleUat - Assembles bundles for all Uat variants.
clean - Deletes the build directory.
compileProductionDebugAndroidTestSources
compileProductionDebugSources
compileProductionDebugUnitTestSources
compileProductionReleaseSources
compileProductionReleaseUnitTestSources
compileUatDebugAndroidTestSources
compileUatDebugSources
compileUatDebugUnitTestSources
compileUatReleaseSources
compileUatReleaseUnitTestSources

Build Setup tasks
-----------------
init - Initializes a new Gradle build.
wrapper - Generates Gradle wrapper files.

Help tasks
----------
buildEnvironment - Displays all buildscript dependencies declared in root project 'com.bananas'.
dependencies - Displays all dependencies declared in root project 'com.bananas'.
dependencyInsight - Displays the insight into a specific dependency in root project 'com.bananas'.
help - Displays a help message.
javaToolchains - Displays the detected java toolchains.
outgoingVariants - Displays the outgoing variants of root project 'com.bananas'.
projects - Displays the sub-projects of root project 'com.bananas'.
properties - Displays the properties of root project 'com.bananas'.
resolvableConfigurations - Displays the configurations that can be resolved in root project 'com.bananas'.
tasks - Displays the tasks runnable from root project 'com.bananas' (some of the displayed tasks may belong to subprojects).

Install tasks
-------------
installProductionDebug - Installs the DebugProductionDebug build.
installProductionDebugAndroidTest - Installs the android (on device) tests for the ProductionDebug build.
installProductionRelease - Installs the ReleaseProductionRelease build.
installUatDebug - Installs the DebugUatDebug build.
installUatDebugAndroidTest - Installs the android (on device) tests for the UatDebug build.
installUatRelease - Installs the ReleaseUatRelease build.
uninstallAll - Uninstall all applications.

`;
