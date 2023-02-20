/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  validatePackageName,
  parsePackageNameFromAndroidManifestFile,
  parseNamespaceFromBuildGradleFile,
} from '../getAndroidProject';

describe('android::getAndroidProject', () => {
  const expectedResults = {
    'com.app': true,
    'com.example.app': true,
    'com.my_app': true,
    'org.my_app3': true,
    'com.App': true,
    'com.Example.APP1': true,
    'COM.EXAMPLE.APP': true,
    '': false,
    com: false,
    'com.3example.app': false,
    'com.my_app*': false,
    'org.my-app3': false,
    'com.App ': false,
    'com.Example.APP#1': false,
  };

  Object.keys(expectedResults).forEach((packageName) => {
    it(`should validate package name "${packageName}" correctly`, () => {
      expect(validatePackageName(packageName)).toBe(
        expectedResults[packageName],
      );
    });
  });
});

describe('parsePackageNameFromAndroidManifestFile', () => {
  it('should parse package name from AndroidManifest', () => {
    const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app"
    android:versionCode="1"
    android:versionName="1.0" >
</manifest>`;

    expect(parsePackageNameFromAndroidManifestFile(androidManifest)).toBe(
      'com.example.app',
    );
  });

  it('should return null if package name is missing from AndroidManifest', () => {
    const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0" >
</manifest>`;

    expect(parsePackageNameFromAndroidManifestFile(androidManifest)).toBeNull();
  });
});

describe('parseNamespaceFromBuildGradleFile', () => {
  // Test that it can parse a namespace from a build.gradle file
  it('should parse namespace from build.gradle', () => {
    const buildGradle = `apply plugin: 'com.android.application'

android {
    compileSdkVersion 31
    namespace "com.example.app"
}`;

    expect(parseNamespaceFromBuildGradleFile(buildGradle)).toBe(
      'com.example.app',
    );
  });

  it('should parse namespace with single quotes from build.gradle', () => {
    const buildGradle = `apply plugin: 'com.android.application'

android {
    compileSdkVersion 31
    namespace 'com.example.app'
}`;

    expect(parseNamespaceFromBuildGradleFile(buildGradle)).toBe(
      'com.example.app',
    );
  });

  // Test that it can parse a namespace from a build.gradle.kts file
  it('should parse namespace from build.gradle.kts', () => {
    const buildGradle = `plugins {
    id 'com.android.application'
}

android {
    compileSdk = 31
    namespace = "com.example.app"
}`;

    expect(parseNamespaceFromBuildGradleFile(buildGradle)).toBe(
      'com.example.app',
    );
  });

  // Test that it returns null if namespace is missing from build.gradle
  it('should return null if namespace is missing from build.gradle', () => {
    const buildGradle = `apply plugin: 'com.android.application'
android {
    compileSdkVersion 31
}`;

    expect(parseNamespaceFromBuildGradleFile(buildGradle)).toBeNull();
  });
});
