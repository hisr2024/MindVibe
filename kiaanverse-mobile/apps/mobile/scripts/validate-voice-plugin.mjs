#!/usr/bin/env node
/**
 * validate-voice-plugin.mjs — offline validator for
 * `apps/mobile/plugins/withKiaanSakhaVoicePackages.js`.
 *
 * After 16 failed EAS Android builds chasing autolinker / dual-registration
 * / unresolved-reference symptoms, the only way to be confident that the
 * next build will succeed is to exercise the plugin's three pure patch
 * functions against synthetic Expo SDK 51 prebuild output BEFORE pushing
 * a build:
 *
 *   1. settings.gradle  — must inject `:kiaan-voice-native` include + projectDir
 *   2. app/build.gradle — must inject `implementation project(':kiaan-voice-native')`
 *   3. MainApplication.kt — must inject 4 imports + 4 ReactPackage add() calls
 *      inside `PackageList(this).packages.apply { ... }`
 *
 * For each, this script also re-runs the patch a second time to assert
 * idempotency (Expo prebuild can run multiple times during a single
 * EAS build; non-idempotent patches duplicate lines and break compile).
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — at least one check failed (with a diagnostic)
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_PATH = resolve(
  __dirname,
  '..',
  'plugins',
  'withKiaanSakhaVoicePackages.js',
);

const require = createRequire(import.meta.url);

// The plugin imports `@expo/config-plugins` at top level. That's installed
// during pnpm install on developer machines and on EAS, but this validator
// is meant to run cheaply in any environment (CI, sandbox, local with no
// node_modules). Stub the import — we only need the pure patch functions
// from __internals, not the actual mod runners.
const Module = require('module');
const origLoad = Module._load;
const stub = {
  withMainApplication: (config) => config,
  withSettingsGradle: (config) => config,
  withAppBuildGradle: (config) => config,
};
Module._load = function (request, parent, ...rest) {
  if (request === '@expo/config-plugins') return stub;
  return origLoad.call(this, request, parent, ...rest);
};

const plugin = require(PLUGIN_PATH);
const internals = plugin.__internals;

if (!internals) {
  console.error(
    'FAIL: plugin does not export __internals. Cannot validate offline.',
  );
  process.exit(1);
}

const {
  IMPORTS,
  ADD_LINES,
  SETTINGS_INCLUDE,
  APP_DEP_LINE,
  patchSettingsGradle,
  patchAppBuildGradle,
  addAllImports,
  addAllPackageRegistrations,
} = internals;

// ─── Synthetic Expo SDK 51 prebuild fixtures ────────────────────────────

// Real-shape settings.gradle from `expo prebuild` on SDK 51.
const FAKE_SETTINGS_GRADLE = `rootProject.name = 'Kiaanverse'

dependencyResolutionManagement {
  versionCatalogs {
    reactAndroidLibs {
      from(files(new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim(), "../gradle/libs.versions.toml")))
    }
  }
}

apply from: new File(["node", "--print", "require.resolve('expo/package.json')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle")
useExpoModules()

apply from: new File(["node", "--print", "require.resolve('@react-native-community/cli-platform-android/package.json')"].execute(null, rootDir).text.trim(), "../native_modules.gradle")
applyNativeModulesSettingsGradle(settings)

include ':app'
includeBuild(new File(["node", "--print", "require.resolve('@react-native/gradle-plugin')"].execute(null, rootDir).text.trim(), '..'))
`;

const FAKE_APP_BUILD_GRADLE = `apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

react {
}

android {
    namespace 'com.kiaanverse.app'
    defaultConfig {
        applicationId 'com.kiaanverse.app'
        versionCode 1
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
}

apply from: new File(["node", "--print", "require.resolve('@react-native-community/cli-platform-android/package.json')"].execute(null, rootDir).text.trim(), "../native_modules.gradle");
applyNativeModulesAppBuildGradle(project)
`;

const FAKE_MAIN_APPLICATION_KT = `package com.kiaanverse.app

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
    this,
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        // Packages that cannot be autolinked yet can be added manually here
        return PackageList(this).packages
      }

      override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"
    }
  )
}
`;

// ─── Assertions ─────────────────────────────────────────────────────────

let failures = 0;

function check(label, cond, detail) {
  if (cond) {
    console.log('OK   ' + label);
  } else {
    console.error('FAIL ' + label + (detail ? ': ' + detail : ''));
    failures++;
  }
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

// 1. settings.gradle
{
  const once = patchSettingsGradle(FAKE_SETTINGS_GRADLE);
  check(
    'settings.gradle: include line injected',
    once.includes(SETTINGS_INCLUDE),
    `expected to find "${SETTINGS_INCLUDE}"`,
  );
  check(
    "settings.gradle: projectDir set to '../native/android'",
    /project\([^\)]+\)\.projectDir\s*=\s*new File\(rootProject\.projectDir,\s*'\.\.\/native\/android'\)/.test(
      once,
    ),
    'projectDir line not found or wrong path',
  );
  check(
    "settings.gradle: original `include ':app'` preserved",
    once.includes("include ':app'"),
    'lost the include for :app',
  );
  const twice = patchSettingsGradle(once);
  check(
    'settings.gradle: idempotent (no duplicate include after 2nd run)',
    countOccurrences(twice, SETTINGS_INCLUDE) === 1,
    `found ${countOccurrences(twice, SETTINGS_INCLUDE)} copies of include line`,
  );
}

// 2. app/build.gradle
{
  const once = patchAppBuildGradle(FAKE_APP_BUILD_GRADLE);
  check(
    'app/build.gradle: implementation project line injected',
    once.includes(APP_DEP_LINE),
    `expected "${APP_DEP_LINE}"`,
  );
  check(
    'app/build.gradle: original react-android dep preserved',
    once.includes('implementation("com.facebook.react:react-android")'),
    'lost react-android dep',
  );
  check(
    'app/build.gradle: applyNativeModulesAppBuildGradle still present',
    once.includes('applyNativeModulesAppBuildGradle(project)'),
    'lost native modules apply',
  );
  const twice = patchAppBuildGradle(once);
  check(
    'app/build.gradle: idempotent (no duplicate dep after 2nd run)',
    countOccurrences(twice, APP_DEP_LINE) === 1,
    `found ${countOccurrences(twice, APP_DEP_LINE)} copies of dep line`,
  );
}

// 3. MainApplication.kt
{
  let once = addAllImports(FAKE_MAIN_APPLICATION_KT);
  once = addAllPackageRegistrations(once);

  for (const importLine of IMPORTS) {
    check(
      `MainApplication.kt: import "${importLine}" present`,
      once.includes(importLine),
      'import not injected',
    );
  }
  for (const addLine of ADD_LINES) {
    check(
      `MainApplication.kt: registration "${addLine}" present`,
      once.includes(addLine),
      'add() call not injected',
    );
  }

  check(
    'MainApplication.kt: registrations live inside .apply { ... } block',
    /PackageList\(this\)\.packages\.apply\s*\{[\s\S]*?add\(KiaanAudioPlayerPackage\(\)\)[\s\S]*?\}/.test(
      once,
    ),
    'apply { } block missing or KiaanAudioPlayerPackage not inside it',
  );

  let twice = addAllImports(once);
  twice = addAllPackageRegistrations(twice);
  for (const importLine of IMPORTS) {
    check(
      `MainApplication.kt: import "${importLine}" idempotent`,
      countOccurrences(twice, importLine) === 1,
      `found ${countOccurrences(twice, importLine)} copies`,
    );
  }
  for (const addLine of ADD_LINES) {
    check(
      `MainApplication.kt: registration "${addLine}" idempotent`,
      countOccurrences(twice, addLine) === 1,
      `found ${countOccurrences(twice, addLine)} copies`,
    );
  }
}

// 4. Cross-check: ADD_LINES must cover every Kotlin ReactPackage that JS
//    expects to find at NativeModules.<X>. Drift here = silent runtime
//    "undefined is not an object" when JS calls that native module.
{
  const expected = [
    'KiaanAudioPlayerPackage',
    'KiaanVoicePackage',
    'SakhaVoicePackage',
    'SakhaForegroundServicePackage',
  ];
  for (const klass of expected) {
    check(
      `coverage: ${klass} registered by plugin`,
      ADD_LINES.some((l) => l.includes(klass)) &&
        IMPORTS.some((l) => l.endsWith('.' + klass)),
      'missing import or add() call for this class',
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nvalidate-voice-plugin: all checks passed');
